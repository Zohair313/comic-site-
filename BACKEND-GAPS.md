# Greyfire Backend — Gap Analysis vs. Target Spec

Audit of the manual-payment-verification + digital-asset-delivery system against
the requested e-commerce spec. Covers what is **missing**, what is **broken**, and
what is **at risk**. All line references are current as of this audit.

Status legend: 🔴 critical (breaks a core flow / security) · 🟠 medium · 🟡 low

---

## 1. Infrastructure Mismatch (spec vs. reality)

| Spec asks for | Reality | Impact |
|---|---|---|
| MongoDB / PostgreSQL | JSON files (`backend/data/venmo-orders.json`, `assets.json`, `content.json`) | Single-process only; no concurrent writers; corruption risk (see §4.8) |
| S3 / Cloudinary for uploads | Local disk (`backend/data/uploads/`) | Not durable across deploys; no CDN; single-disk |
| Status `pending_verification` / `completed` | Uses `pending` / `delivered` (+ `paid`, `refunded`, `canceled`) — `routes/venmo.js:14-16` | Naming only; logic is complete |
| Formal Order/Asset schema | Implicit in code, no schema file | No single source of truth for shape |

**Status:** JSON + local disk is acceptable for a single low-volume server, but it
is **not** production-durable. Migrate before real traffic.

---

## 2. Critical — Must Fix Before Going Live

### 2.1 🔴 HTML delivery email download buttons are dead
- **Where:** `backend/lib/mailer.js:288-292` (`buyerDelivery`)
- **What:** `button(link.href, …)` renders the raw relative path
  `/api/venmo/download/<id>?token=…` into the **HTML** body. `absolute()` is
  applied **only** to the `text/plain` alternative (`mailer.js:326`).
- **Impact:** Every download button in the buyer's HTML email is unclickable —
  the single most important post-payment flow silently fails. Plain-text email
  still works. Hidden in tests because `test/delivery.test.mjs:108` sets
  `PUBLIC_BASE_URL`.
- **Fix:** Run every href through `absolute()` before rendering HTML, same as the
  text body.

### 2.2 🔴 `GET /api/orders/verify-action` has no rate limit
- **Where:** `backend/server.js:175` (alias) vs `routes/venmo.js:903` (canonical)
- **What:** The canonical `/api/venmo/verify-action` is wrapped in `lookupLimiter`
  (120/min). The spec'd alias `/api/orders/verify-action` is registered as the bare
  handler with **no limiter**. This unauthenticated endpoint mutates order status
  and triggers buyer email delivery.
- **Impact:** Unbounded, unauthenticated brute-force / replay surface.
- **Fix:** Wrap the alias in `lookupLimiter` too (export it, or mount the router).

### 2.3 🔴 Payment verification never triggers delivery
- **Where:** `backend/routes/venmo.js:537-585` (`applyPaymentReport`)
- **What:** Sets status to `paid` and stops. Never calls
  `applyDelivery` / `deliverOrder`.
- **Impact:** An order confirmed via inbox ingest or the admin "Verify" button
  sits at `paid` with **no files attached and no buyer email** until someone
  separately `PATCH`es `status:'delivered'`.
- **Fix:** On a successful payment match, call `deliverOrder(orderId, { by: 'auto' })`.

### 2.4 🔴 Paid assets + payment proofs were publicly served (FIXED)
- **Where:** `backend/server.js` static mount
- **What:** An earlier change mounted `express.static` on the whole `UPLOADS_DIR`
  at `/uploads`, exposing `assets/` (the paid goods) and `screenshots/` (payment
  proofs) without auth. Filenames are random hex and `storedName` is stripped from
  API responses, so it was not trivially guessable — but it was public by
  construction.
- **Fix applied:** Now mounts only `/uploads/images` (content images). Verified:
  content image → 200, paid asset → 404, payment proof → 404.

---

## 3. Medium — Should Fix

### 3.1 🟠 `order.delivery` duplicates on every re-approval (unbounded growth)
- **Where:** `routes/venmo.js:427-432` (`applyDelivery`)
- **What:** The dedupe filter (`:430`) only excludes entries that have a `.url`
  (admin-added external links). Granted asset entries persist as `{label, assetId}`
  with no `url`, so on every subsequent approval all assets are re-resolved and
  **appended again**.
- **Impact:** `[A,B]` → `[A,B,A,B]` → grows forever. History counts inflate; a
  re-sent delivery email shows duplicate buttons. No duplicate *email*, but the
  array is wrong.
- **Note:** Untested — no assertion on `delivery.length` stability.

### 3.2 🟠 Rejecting an already-paid order emails the buyer "payment failed"
- **Where:** `routes/venmo.js:831-834` + `:864-876`
- **What:** `CLOSED_STATUSES` includes `paid` and `delivered` (`:16`), so
  `setStatus` is skipped, but `mailer.buyerRejection` fires **unconditionally**.
- **Impact:** Buyer who already received files is told their payment failed.
  Reachable because `/api/venmo/inbox` can auto-advance to `paid` (`:579`) before
  the owner clicks Reject.

### 3.3 🟠 Dashboard reject never notifies the buyer
- **Where:** `routes/venmo.js:1170` (`patchOrder`)
- **What:** Sets `rejected` via `setStatus` only. Nothing sends `buyerRejection`
  (`mailer.js:337`). Only the email-link reject path (`:865`) sends it.
- **Impact:** A buyer rejected from the dashboard gets **no notification at all**.

### 3.4 🟠 Crash mid-delivery permanently wedges the order
- **Where:** `routes/venmo.js:457` → `:469-476`
- **What:** If the process dies between `status:'sending'` and `'sent'`,
  `deliveryEmail.status` stays `'sending'` forever. `applyDelivery`'s `inflight`
  check (`:435`) then suppresses `notify` on every future approval.
- **Impact:** Order can never be delivered again. No timeout, no recovery path,
  not re-armable from the dashboard.

### 3.5 🟠 `PATCH status:'delivered'` on a refunded/canceled order returns a false 200
- **Where:** `routes/venmo.js:1169-1170`, `:1192`
- **What:** `setStatus` is skipped; `deliverOrder` returns `{error:'closed'}`
  (`:454`); that return is **discarded**. Handler re-reads and returns **200 OK
  with the unchanged order**.
- **Impact:** Admin believes delivery happened; nothing did.

### 3.6 🟠 `readJson` silently discards all orders on a corrupt file
- **Where:** `backend/lib/store.js:8-19`
- **What:** Any read/parse error returns the default (`{orders: []}`). The next
  `orderStore.run` writes that empty array back (`orders.js:37-38`).
- **Impact:** One bad write → **permanent total order-history loss**, no error
  surfaced. Aggravated by `writeJson` having no `fsync` and a `process.pid` temp
  name that can collide across processes.

### 3.7 🟠 Screenshots never garbage-collected
- **Where:** `storage.remove` is called only for assets (`routes/venmo.js:1070`)
- **Impact:** Payment-proof screenshots accumulate on disk forever. Trimming past
  2000 orders (`orders.js:37`) orphans both rows and bytes.

### 3.8 🟠 Wildcard CORS + no CSRF/Origin check
- **Where:** `backend/server.js:38` (`app.use(cors())`)
- **What:** Any origin is reflected. No Origin/Referer validation on state-changing
  endpoints. Admin bearer token lives in JS (`sessionStorage`), and wildcard CORS
  means any site can drive authenticated admin calls if it obtains the token.

### 3.9 🟠 Weak / default secrets
- **Where:** `backend/server.js:25-26`
- **What:** `ADMIN_PASS` defaults to `admin`; `AUTH_SECRET` defaults to
  `change-me-in-production`. `AUTH_SECRET` is **also** the HMAC key for every
  approve/reject/download token (`server.js:85`).
- **Impact:** With the default secret, anyone can **forge approve links and
  download tokens**. `actionTokens.js:23-25` only requires ≥8 chars.
- **Fix:** Set strong `ADMIN_PASS` + `AUTH_SECRET` in env before deploy.

### 3.10 🟠 `TRUST_PROXY` unset → all clients share one rate-limit bucket
- **Where:** `backend/server.js:37`
- **What:** `req.ip` is the socket address unless `TRUST_PROXY` is set. Behind a
  reverse proxy without it, every client looks like one IP → one abuser can 429
  everyone.

---

## 4. Low — Nice to Have

### 4.1 🟡 `autoConfirm` is a dead knob
- `routes/venmo.js:70`, `:307` — persisted, admin-editable, exposed in
  `GET /admin/config`, but **never read** by any logic.

### 4.2 🟡 Dead SMTP transport cache — new connection per email
- `mailer.js:140-148` — cache key check (`cached?.key === cfg.key`) never matches
  because `config()` (`:127-137`) never sets `key`. A brand-new transport (and
  SMTP connection) is built for **every** email.

### 4.3 🟡 Verify-amount button is a no-op
- `routes/venmo.js:1211` — `toCents(...) ?? found.totalCents` means an empty body
  defaults to the order's own total, so `amountMatches` (`:195-199`) always passes.
  Tested as such (`test/delivery.test.mjs:315`).

### 4.4 🟡 `body.delivery === null` wipes admin-added links
- `routes/venmo.js:1149-1150` — the filter keeps only `assetId`, deleting manual
  `{label, url}` entries. Inconsistent with the array branch (`:1152-1161`).

### 4.5 🟡 Download tokens churn on every read
- `routes/venmo.js:201-206` (`decorateDelivery`) mints a **new** download token
  for every delivery entry on every read → the emailed link, the order-lookup
  link, and the dashboard link are three different tokens for the same asset.

### 4.6 🟡 Proof file written before the order row
- `routes/venmo.js:701` vs `:716` — if `orderStore.run` then rejects (disk full),
  the screenshot is orphaned with no order referencing it.

### 4.7 🟡 Login timing side-channel
- `auth.js:36-37` — `checkCredentials` short-circuits `&&`, so a wrong username
  returns faster than right-username/wrong-password.

### 4.8 🟡 Misc inconsistencies
- `counts.total` unfiltered while `total` is filtered (`venmo.js:1085` vs `:1102`).
- `assetStore.find` case-sensitive; `orderStore.find` case-insensitive
  (`assets.js:71` vs `orders.js:27-30`).
- `adminOrder.proof.url` looks unauthenticated but is auth-gated (`venmo.js:1112`) —
  fine, just noting it's the only route serving proof.

---

## 5. What Is Already Done (no action needed)

For reference, these spec requirements are **fully implemented and tested**
(48/48 backend tests pass):

- ✅ `POST /api/orders/checkout` (+ `/api/venmo/orders`) — buyer details, optional
  Venmo handle / transaction ID, proof upload (5MB, JPEG/PNG/WebP), server-side
  price validation, order created as `pending`.
- ✅ Owner notification email on new order with order ID, buyer details, total,
  **screenshot attached + inlined** (`cid:`), and **Approve & Deliver** /
  **Reject Payment** buttons.
- ✅ `GET /api/orders/verify-action?token=…&action=approve|reject` — HMAC-signed,
  single-use (nonce + `usedAt` under lock), action-tamper-proofed (400 on
  mismatched action), 72h TTL.
- ✅ `PATCH /api/admin/orders/:id/status` — bearer-auth'd, allow-listed statuses.
- ✅ Buyer delivery email with **signed, 30-day expiring** download links
  (4-gate validation: signature, asset match, order paid/delivered + in
  `delivery`, file on disk).
- ✅ **Idempotent delivery** — `deliveryEmail.status` compare-and-set under lock
  prevents duplicate buyer emails on double-approve (email-link, dashboard, or
  mixed). Covered by tests `delivery.test.mjs:337-390`.
- ✅ Admin dashboard — order table by status, screenshot preview, approve/reject,
  asset management.
- ✅ Rate limiting on public checkout (8/10min), verify-action, order lookup,
  download; login limiting (10/15min).

---

## 6. Recommended Fix Order

1. **2.1** — email download buttons (breaks delivery)
2. **2.3** — auto-deliver on payment verify (breaks delivery)
3. **2.2** — rate-limit the verify-action alias (security)
4. **3.9** — set strong `AUTH_SECRET` + `ADMIN_PASS` (security, config-only)
5. **3.6** — stop `readJson` wiping orders on corruption (data loss)
6. **3.1** — dedupe `order.delivery` (data correctness)
7. **3.2 / 3.3** — correct reject-email behavior (UX/correctness)
8. **3.4 / 3.5** — delivery wedge + false-200 (reliability)
9. **3.8 / 3.10** — CORS allow-list, `TRUST_PROXY` (hardening)
10. §4 low-priority items
11. Consider Postgres + S3 migration for durability (spec §1)
