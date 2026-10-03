import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-e2e-'));

process.env.DATA_FILE = path.join(tmp, 'content.json');
process.env.VENMO_FILE = path.join(tmp, 'venmo.json');
process.env.VENMO_ORDERS_FILE = path.join(tmp, 'venmo-orders.json');
process.env.VENMO_QR_FILE = path.join(tmp, 'venmo-qr.bin');
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASS = 'secret-pass';
process.env.AUTH_SECRET = 'test-secret';
process.env.VENMO_INGEST_TOKEN = 'ingest-secret';
process.env.PORT = '3199';

await import('../server.js');
await new Promise((r) => setTimeout(r, 600));

const BASE = 'http://127.0.0.1:3199';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${detail}` : ''}`);
};

// ---- exact replica of webapp/src/lib/api.js jsonFetch ----
async function jsonFetch(p, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${BASE}${p}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

// ---- health ----
const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
check('health', health.ok === true);

const raw = await fetch(`${BASE}/api/health`);
check('CORS is wide open (any origin allowed)', raw.headers.get('access-control-allow-origin') === '*', raw.headers.get('access-control-allow-origin') || '(none)');

// The site is on GitHub Pages and the API on another host, so every JSON
// write/Authorization call is cross-origin and triggers a preflight.
const preflight = await fetch(`${BASE}/api/venmo/admin/orders`, {
  method: 'OPTIONS',
  headers: {
    Origin: 'https://greyfirestudio.github.io',
    'Access-Control-Request-Method': 'PATCH',
    'Access-Control-Request-Headers': 'content-type,authorization',
  },
});
const allowHeaders = (preflight.headers.get('access-control-allow-headers') || '').toLowerCase();
check(
  'CORS preflight allows a cross-origin authenticated PATCH',
  preflight.status >= 200 &&
    preflight.status < 300 &&
    allowHeaders.includes('authorization') &&
    allowHeaders.includes('content-type'),
  `status=${preflight.status} allowHeaders="${preflight.headers.get('access-control-allow-headers')}" allowOrigin="${preflight.headers.get('access-control-allow-origin')}"`
);

const preflightIngest = await fetch(`${BASE}/api/venmo/inbox`, {
  method: 'OPTIONS',
  headers: {
    Origin: 'https://greyfirestudio.github.io',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,x-ingest-token',
  },
});
check(
  'CORS preflight allows the email forwarder to POST x-ingest-token',
  preflightIngest.status >= 200 &&
    preflightIngest.status < 300 &&
    (preflightIngest.headers.get('access-control-allow-headers') || '').toLowerCase().includes('x-ingest-token'),
  `status=${preflightIngest.status} allowHeaders="${preflightIngest.headers.get('access-control-allow-headers')}"`
);

// ---- login ----
const login = await jsonFetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username: 'admin', password: 'secret-pass' }),
});
const token = login.token;
check('login returns token', Boolean(token));

const badLogin = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'wrong' }),
});
check('bad login is 401', badLogin.status === 401, String(badLogin.status));

// login brute force: is it rate limited?
let bruteOk = 0;
for (let i = 0; i < 30; i += 1) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: `guess-${i}` }),
  });
  if (r.status !== 429) bruteOk += 1;
}
check('login brute force is rate limited', bruteOk < 30, `${bruteOk}/30 attempts were NOT throttled`);

const authHeaders = { Authorization: `Bearer ${token}` };

// ---- admin config: the header bug ----
const cfgGet = await jsonFetch('/api/venmo/admin/config', { headers: authHeaders });
check('admin config GET works', Boolean(cfgGet.config), JSON.stringify(cfgGet.config?.handle ?? ''));

const cfgPut = await jsonFetch('/api/venmo/admin/config', {
  method: 'PUT',
  headers: authHeaders,
  body: JSON.stringify({
    handle: 'greyfire-test',
    displayName: 'Greyfire Test',
    enabled: true,
    feeMode: 'add',
    feePercent: 2.9,
    feeFixedCents: 29,
    products: [{ id: 'plan-a', title: 'Plan A', description: 'desc', priceCents: 599, active: true }],
  }),
}).catch((e) => ({ error: e.message }));

const after = cfgGet.config;
const cfgAfter = await jsonFetch('/api/venmo/admin/config', { headers: authHeaders });
check(
  'admin config PUT actually persisted the body (Content-Type survived?)',
  cfgAfter.config.handle === 'greyfire-test' && cfgAfter.config.enabled === true,
  `handle sent="greyfire-test" stored="${cfgAfter.config.handle}" | putResponse=${JSON.stringify(cfgPut).slice(0, 160)}`
);
void after;

// ---- public config ----
const pub = await jsonFetch('/api/venmo/config');
check('public config enabled after admin save', pub.enabled === true, `enabled=${pub.enabled} handle=${pub.handle}`);
check('public config hides accountEmail', !('accountEmail' in pub), Object.keys(pub).join(','));

// ---- create order ----
const created = await jsonFetch('/api/venmo/orders', {
  method: 'POST',
  body: JSON.stringify({ items: [{ id: 'plan-a', qty: 2 }], buyer: { name: 'Jane Doe', email: 'jane@example.com' } }),
});
const order = created.order;
check('order created', Boolean(order?.id), order?.id);
check('order starts pending', order.status === 'pending');
check('fee applied (2.9% + 29c on $11.98 = $0.64)', order.feeCents === 64, `subtotal=${order.subtotalCents} fee=${order.feeCents} total=${order.totalCents}`);

// ---- public order lookup hides email ----
const looked = await jsonFetch(`/api/venmo/orders/${order.id}?token=${order.token}`);
check('public order hides buyer email', !('email' in looked.order.buyer), JSON.stringify(looked.order.buyer));
check('public order hides delivery while pending', Array.isArray(looked.order.delivery) && looked.order.delivery.length === 0);

// wrong token
const badLookup = await fetch(`${BASE}/api/venmo/orders/${order.id}?token=wrong`);
check('wrong order token is rejected', badLookup.status === 404, String(badLookup.status));

// ---- email inbox auto-confirm ----
const inbox = await fetch(`${BASE}/api/venmo/inbox`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-ingest-token': 'ingest-secret' },
  body: JSON.stringify({
    subject: `You received $${(order.totalCents / 100).toFixed(2)} from Jane Doe`,
    body: `Note: ${order.paymentNote}`,
  }),
}).then((r) => r.json());
check('inbox auto-confirmed the order', inbox.ok === true, JSON.stringify(inbox));

// double inbox = should not double pay
const inbox2 = await fetch(`${BASE}/api/venmo/inbox`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-ingest-token': 'ingest-secret' },
  body: JSON.stringify({ orderId: order.id, amount: order.total }),
}).then((r) => r.json());
check('replayed inbox email is not double-counted', inbox2.ok === false && inbox2.reason === 'order_not_pending', JSON.stringify(inbox2));

// wrong token on inbox
const inboxBad = await fetch(`${BASE}/api/venmo/inbox`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-ingest-token': 'nope' },
  body: JSON.stringify({ orderId: order.id }),
});
check('inbox rejects a bad token', inboxBad.status === 401, String(inboxBad.status));

// ---- admin list / patch delivery ----
const list = await jsonFetch(`/api/venmo/admin/orders?limit=50&status=all`, { headers: authHeaders });
check('admin list shows buyer email', Boolean(list.orders[0]?.buyer?.email), list.orders[0]?.buyer?.email);
check('admin counts present', typeof list.counts?.total === 'number', JSON.stringify(list.counts));

const patch = await jsonFetch(`/api/venmo/admin/orders/${order.id}`, {
  method: 'PATCH',
  headers: authHeaders,
  body: JSON.stringify({
    delivery: [
      { label: 'Comic PDF', url: 'https://example.com/a.pdf' },
      { label: 'bad', url: 'javascript:alert(1)' },
    ],
    status: 'delivered',
  }),
}).catch((e) => ({ error: e.message }));

const afterPatch = await jsonFetch(`/api/venmo/admin/orders/${order.id}`, { headers: authHeaders });
check(
  'admin PATCH delivery actually persisted (Content-Type survived?)',
  afterPatch.order.delivery.length === 1 && afterPatch.order.status === 'delivered',
  `delivery=${JSON.stringify(afterPatch.order.delivery)} status=${afterPatch.order.status} | patchResponse=${JSON.stringify(patch).slice(0, 160)}`
);
check('javascript: delivery url was stripped', !JSON.stringify(afterPatch.order.delivery).includes('javascript:'));

// ---- buyer sees files now ----
const afterDeliver = await jsonFetch(`/api/venmo/orders/${order.id}?token=${order.token}`);
check('buyer sees the download link after delivery', afterDeliver.order.delivery.length === 1, JSON.stringify(afterDeliver.order.delivery));

// ---- admin note ----
await jsonFetch(`/api/venmo/admin/orders/${order.id}`, {
  method: 'PATCH',
  headers: authHeaders,
  body: JSON.stringify({ adminNote: 'checked in venmo app' }),
}).catch(() => {});
const afterNote = await jsonFetch(`/api/venmo/admin/orders/${order.id}`, { headers: authHeaders });
check('admin note persisted (Content-Type survived?)', afterNote.order.adminNote === 'checked in venmo app', `"${afterNote.order.adminNote}"`);

// ---- PATCH must not leak the admin note to the buyer ----
const buyerView = await jsonFetch(`/api/venmo/orders/${order.id}?token=${order.token}`);
check('buyer cannot see the private admin note', !('adminNote' in buyerView.order), JSON.stringify(Object.keys(buyerView.order)));

// ---- unauth access ----
const noAuth = await fetch(`${BASE}/api/venmo/admin/orders`);
check('admin orders require auth', noAuth.status === 401, String(noAuth.status));
const noAuthCfg = await fetch(`${BASE}/api/venmo/admin/config`);
check('admin config requires auth', noAuthCfg.status === 401, String(noAuthCfg.status));
const noAuthPut = await fetch(`${BASE}/api/venmo/admin/config`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: false }),
});
check('admin config PUT requires auth', noAuthPut.status === 401, String(noAuthPut.status));

// ---- price tampering ----
const tamper = await jsonFetch('/api/venmo/orders', {
  method: 'POST',
  body: JSON.stringify({ items: [{ id: 'plan-a', qty: 1, priceCents: 1 }], buyer: { name: 'Hacker', email: 'h@example.com' } }),
});
check('client-supplied price is ignored (server price wins)', tamper.order.subtotalCents === 599, `subtotal=${tamper.order.subtotalCents}`);

const inactive = await jsonFetch('/api/venmo/orders', {
  method: 'POST',
  body: JSON.stringify({ items: [{ id: 'nope', qty: 1 }], buyer: { name: 'X', email: 'x@example.com' } }),
}).catch((e) => ({ error: e.message }));
check('unknown product id is rejected', Boolean(inactive.error), JSON.stringify(inactive).slice(0, 80));

const hugeQty = await jsonFetch('/api/venmo/orders', {
  method: 'POST',
  body: JSON.stringify({ items: [{ id: 'plan-a', qty: 100000 }], buyer: { name: 'X', email: 'x@example.com' } }),
});
check('qty is clamped to 99', hugeQty.order.items[0].qty === 99, `qty=${hugeQty.order.items[0].qty}`);

// ---- env override stickiness ----
const cfgNow = await jsonFetch('/api/venmo/admin/config', { headers: authHeaders });
await jsonFetch('/api/venmo/admin/config', {
  method: 'PUT',
  headers: authHeaders,
  body: JSON.stringify({ feePercent: 0 }),
}).catch(() => {});
const cfgZero = await jsonFetch('/api/venmo/admin/config', { headers: authHeaders });
check('admin can set feePercent to 0', cfgZero.config.feePercent === 0, `feePercent=${cfgZero.config.feePercent} (was ${cfgNow.config.feePercent})`);

// ---- multi-line instructions ----
await jsonFetch('/api/venmo/admin/config', {
  method: 'PUT',
  headers: authHeaders,
  body: JSON.stringify({ instructions: 'Step one.\nStep two.\nStep three.' }),
}).catch(() => {});
const pub2 = await jsonFetch('/api/venmo/config');
check('multi-line instructions keep their line breaks', pub2.instructions.includes('\n'), JSON.stringify(pub2.instructions));

// ---- order token in query string lands in logs ----
const qs = await fetch(`${BASE}/api/venmo/orders/${order.id}?token=${order.token}`);
check('order token works via query string (log exposure)', qs.status === 200, String(qs.status));

// ---- reuse the SAME order via a second browser: token is required ----
const noTok = await fetch(`${BASE}/api/venmo/orders/${order.id}`);
check('order without token is 404', noTok.status === 404, String(noTok.status));

console.log('\n---- SUMMARY ----');
const failed = results.filter((r) => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed, ${failed.length} failed`);
for (const f of failed) console.log(`  FAIL: ${f.name} :: ${f.detail}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(0);
