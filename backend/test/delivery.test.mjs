import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3196;
const BASE = `http://127.0.0.1:${PORT}`;
const DATA_DIR = path.join(os.tmpdir(), 'greyfire-delivery-test');
const OUTBOX = path.join(DATA_DIR, 'mail-outbox');

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const ZIP_BYTES = Buffer.from('PK pretend this is a comic archive');
const ADMIN_EMAIL = 'owner@greyfirestudio.test';

let server;
let auth = {};

const api = (method, url, body, headers = {}) =>
  fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, json: await res.json().catch(() => ({})) }));

const asAdmin = (method, url, body) => api(method, url, body, auth);

function form(fields, file) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  if (file) fd.set(file.field, new Blob([file.bytes], { type: file.type }), file.name);
  return fd;
}

async function postForm(url, fields, file, headers = {}) {
  const res = await fetch(`${BASE}${url}`, { method: 'POST', headers, body: form(fields, file) });
  return { status: res.status, json: await res.json().catch(() => ({})), res };
}

const postFormAsAdmin = (url, fields, file) => postForm(url, fields, file, auth);

const enableCheckout = () =>
  asAdmin('PUT', '/api/venmo/admin/config', {
    enabled: true,
    handle: 'greyfire-studio',
    displayName: 'Greyfire Studio',
    feeMode: 'absorb',
    noteTemplate: 'Greyfire {orderId}',
  });

async function placeOrderWithProof({ email = 'rin@example.com', productId = 'plan-pro-monthly' } = {}) {
  return postForm(
    '/api/venmo/orders',
    {
      items: JSON.stringify([{ id: productId, qty: 1 }]),
      buyer: JSON.stringify({ name: 'Rin', email, handle: 'rin-b', transactionId: 'TX-4242' }),
    },
    { field: 'proof', bytes: PNG_1PX, type: 'image/png', name: 'venmo-receipt.png' }
  );
}

const placeOrderJson = (email = 'plain@example.com', productId = 'plan-basic-monthly') =>
  api('POST', '/api/venmo/orders', { items: [{ id: productId, qty: 1 }], buyer: { name: 'Plain', email } });

const outboxFiles = () =>
  fs.existsSync(OUTBOX) ? fs.readdirSync(OUTBOX).filter((f) => f.endsWith('.html')).sort() : [];

const outboxBodies = () => outboxFiles().map((f) => fs.readFileSync(path.join(OUTBOX, f), 'utf8'));

const emailsMatching = (needle) => outboxBodies().filter((body) => body.includes(needle));

function actionToken(orderId, action) {
  const bodies = emailsMatching(`action=${action}`).filter((body) => body.includes(orderId));
  assert.ok(bodies.length, `no ${action} link found for ${orderId}`);
  const latest = bodies[bodies.length - 1];
  const match = latest.match(new RegExp(`token=([A-Za-z0-9_.\\-]+)&(?:amp;)?action=${action}`));
  assert.ok(match, `could not parse the ${action} token out of the alert email`);
  return match[1];
}

const tokenUrl = (token, action) => `${BASE}/api/venmo/verify-action?token=${token}&action=${action}`;

async function html(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, body: await res.text() };
}

before(async () => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      ADMIN_USER: 'admin',
      ADMIN_PASS: 'test123',
      AUTH_SECRET: 'test-secret-long',
      ADMIN_EMAIL,
      MAIL_TRANSPORT: 'console',
      PUBLIC_BASE_URL: BASE,
      VENMO_RATE_LIMIT_MAX: '500',
      DATA_FILE: path.join(DATA_DIR, 'content.json'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start')), 15000);
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('running on')) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited with ${code}`));
    });
  });

  auth = { Authorization: `Bearer ${(await api('POST', '/api/auth/login', { username: 'admin', password: 'test123' })).json.token}` };
  await enableCheckout();
});

after(() => {
  server?.kill();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

test('checkout accepts a multipart order with a payment screenshot', async () => {
  const { status, json } = await placeOrderWithProof();
  assert.equal(status, 201);
  assert.equal(json.order.status, 'pending');
  assert.equal(json.order.hasProof, true);
  assert.equal(json.order.paymentNote.startsWith('Greyfire GF-'), true);
  // the buyer never sees their own email or the screenshot bytes
  assert.deepEqual(Object.keys(json.order.buyer), ['name']);

  const admin = await asAdmin('GET', `/api/venmo/admin/orders/${json.order.id}`);
  assert.equal(admin.json.order.buyer.email, 'rin@example.com');
  assert.equal(admin.json.order.buyer.handle, 'rin-b');
  assert.equal(admin.json.order.buyer.transactionId, 'TX-4242');
  assert.equal(admin.json.order.proof.uploaded, true);
  assert.equal(admin.json.order.proof.mime, 'image/png');
  assert.equal(admin.json.order.alert.ok, true);
});

test('the uploaded screenshot is served to the admin and to nobody else', async () => {
  const { json } = await placeOrderWithProof({ email: 'proof@example.com' });
  const id = json.order.id;
  const adminOrder = (await asAdmin('GET', `/api/venmo/admin/orders/${id}`)).json.order;
  const proofUrl = adminOrder.proof.url;
  assert.match(proofUrl, /^\/api\/venmo\/admin\/orders\/.+\/proof$/);

  const anonymous = await fetch(`${BASE}${proofUrl}`);
  assert.equal(anonymous.status, 401);

  const res = await fetch(`${BASE}${proofUrl}`, { headers: auth });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.match(res.headers.get('content-disposition'), /^inline;/);
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), PNG_1PX);
});

test('a non-image or oversized screenshot is refused', async () => {
  const notAnImage = await postForm(
    '/api/venmo/orders',
    { items: JSON.stringify([{ id: 'plan-pro-monthly' }]), buyer: JSON.stringify({ email: 'x@example.com' }) },
    { field: 'proof', bytes: Buffer.from('%PDF-1.4 not an image'), type: 'application/pdf', name: 'receipt.pdf' }
  );
  assert.equal(notAnImage.status, 415);

  const tooBig = Buffer.concat([PNG_1PX, Buffer.alloc(5 * 1024 * 1024)]);
  const oversized = await postForm(
    '/api/venmo/orders',
    { items: JSON.stringify([{ id: 'plan-pro-monthly' }]), buyer: JSON.stringify({ email: 'x@example.com' }) },
    { field: 'proof', bytes: tooBig, type: 'image/png', name: 'huge.png' }
  );
  assert.equal(oversized.status, 413);
});

test('an order with no screenshot is still accepted', async () => {
  const { status, json } = await placeOrderJson('noscreenshot@example.com');
  assert.equal(status, 201);
  assert.equal(json.order.hasProof, false);
  const admin = await asAdmin('GET', `/api/venmo/admin/orders/${json.order.id}`);
  assert.equal(admin.json.order.proof.uploaded, false);
  assert.equal((await fetch(`${BASE}/api/venmo/admin/orders/${json.order.id}/proof`, { headers: auth })).status, 404);
});

test('assets upload to disk and are listed without leaking their stored path', async () => {
  const created = await postFormAsAdmin(
    '/api/venmo/admin/assets',
    { label: 'OC pack — Fire', description: 'Layered PSD + PNG', productIds: 'plan-pro-monthly' },
    { field: 'file', bytes: ZIP_BYTES, type: 'application/zip', name: 'oc-fire.zip' }
  );
  assert.equal(created.status, 201);
  assert.equal(created.json.asset.label, 'OC pack — Fire');
  assert.equal(created.json.asset.filename, 'oc-fire.zip');
  assert.equal(created.json.asset.stored, true);
  assert.equal('storedName' in created.json.asset, false);
  assert.deepEqual(created.json.asset.productIds, ['plan-pro-monthly']);

  const list = await asAdmin('GET', '/api/venmo/admin/assets');
  assert.equal(list.json.assets.length, 1);
  assert.equal('storedName' in list.json.assets[0], false);
  assert.equal((await api('POST', '/api/venmo/admin/assets')).status, 401);
});

test('an unsupported asset file type is refused', async () => {
  const bad = await postFormAsAdmin(
    '/api/venmo/admin/assets',
    { label: 'Nope' },
    { field: 'file', bytes: Buffer.from('nope'), type: 'application/x-msdownload', name: 'payload.exe' }
  );
  assert.equal(bad.status, 415);
  assert.equal((await asAdmin('GET', '/api/venmo/admin/assets')).json.assets.length, 1);
});

test('a token cannot be tampered with or reused', async () => {
  const { json } = await placeOrderWithProof({ email: 'tamper@example.com' });
  const token = actionToken(json.order.id, 'approve');

  const flipped = `${token.slice(0, -3)}aaa`;
  const bad = await html(`${BASE}/api/venmo/verify-action?token=${flipped}&action=approve`);
  assert.equal(bad.status, 400);
  assert.match(bad.body, /no longer valid/i);

  const missing = await html(`${BASE}/api/venmo/verify-action?token=&action=approve`);
  assert.equal(missing.status, 400);

  // A valid approve token asked to do the other thing is refused.
  const mismatch = await html(`${BASE}/api/venmo/verify-action?token=${token}&action=reject`);
  assert.equal(mismatch.status, 400);

  const stillPending = (await asAdmin('GET', `/api/venmo/admin/orders/${json.order.id}`)).json.order;
  assert.equal(stillPending.status, 'pending');
});

test('approving from the email delivers the assets and emails the buyer once', async () => {
  const { json } = await placeOrderWithProof({ email: 'approve@example.com' });
  const id = json.order.id;
  const before = emailsMatching(`order ${id}`).length;
  assert.ok(before >= 1, 'the admin alert should have been written');

  const token = actionToken(id, 'approve');
  const approved = await html(tokenUrl(token, 'approve'));
  assert.equal(approved.status, 200);
  assert.match(approved.body, /approved and files delivered/i);

  const order = (await asAdmin('GET', `/api/venmo/admin/orders/${id}`)).json.order;
  assert.equal(order.status, 'delivered');
  assert.equal(order.deliveryEmail.status, 'sent');
  assert.ok(order.paidAt);
  assert.ok(order.deliveredAt);
  const assetEntry = order.delivery.find((entry) => entry.assetId);
  assert.ok(assetEntry, 'the entitled asset should be attached');
  assert.ok(assetEntry.url.includes('/api/venmo/download/'));

  // Re-clicking the same link must not deliver or email a second time.
  const replay = await html(tokenUrl(token, 'approve'));
  assert.equal(replay.status, 200);
  assert.match(replay.body, /already actioned/i);
  const after = (await asAdmin('GET', `/api/venmo/admin/orders/${id}`)).json.order;
  assert.equal(after.status, 'delivered');
  assert.equal(after.delivery.length, order.delivery.length);
  assert.equal(emailsMatching(`Your Greyfire files are ready`).length >= 1, true);
});

test('the buyer can download an entitled asset but not an unentitled one', async () => {
  const { json } = await placeOrderWithProof({ email: 'downloads@example.com' });
  const id = json.order.id;
  await html(tokenUrl(actionToken(id, 'approve'), 'approve'));

  const order = (await asAdmin('GET', `/api/venmo/admin/orders/${id}`)).json.order;
  const granted = order.delivery.find((entry) => entry.assetId);
  assert.ok(granted);

  const res = await fetch(`${BASE}${granted.url}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/zip');
  assert.match(res.headers.get('content-disposition'), /attachment; filename="oc-fire.zip"/);
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), ZIP_BYTES);

  // Same token, wrong asset.
  const swapped = new URL(granted.url, BASE);
  swapped.pathname = '/api/venmo/download/asset-notreal';
  assert.equal((await fetch(swapped)).status, 403);
  // No token at all.
  assert.equal((await fetch(`${BASE}/api/venmo/download/${granted.assetId}`)).status, 403);
});

test('a pending buyer cannot download before approval', async () => {
  const { json } = await placeOrderWithProof({ email: 'early@example.com' });
  const assets = (await asAdmin('GET', '/api/venmo/admin/assets')).json.assets;
  const [asset] = assets;
  assert.equal((await fetch(`${BASE}/api/venmo/download/${asset.id}?token=bogus`)).status, 403);
  const pending = (await asAdmin('GET', `/api/venmo/admin/orders/${json.order.id}`)).json.order;
  assert.equal(pending.status, 'pending');
});

test('rejecting from the email marks the order and tells the buyer', async () => {
  const { json } = await placeOrderWithProof({ email: 'reject@example.com' });
  const id = json.order.id;

  const rejected = await html(tokenUrl(actionToken(id, 'reject'), 'reject'));
  assert.equal(rejected.status, 200);
  assert.match(rejected.body, /marked as not received/i);

  const order = (await asAdmin('GET', `/api/venmo/admin/orders/${id}`)).json.order;
  assert.equal(order.status, 'rejected');
  assert.equal(order.delivery.length, 0);

  const replay = await html(tokenUrl(actionToken(id, 'reject'), 'reject'));
  assert.equal(replay.status, 200);
  assert.match(replay.body, /already actioned/i);
});

test('an action link cannot be reused across a different order', async () => {
  const first = await placeOrderWithProof({ email: 'swap-a@example.com' });
  const second = await placeOrderWithProof({ email: 'swap-b@example.com' });
  const firstToken = actionToken(first.json.order.id, 'approve');
  const res = await html(tokenUrl(firstToken, 'approve'));
  assert.equal(res.status, 200);
  // The second order is untouched by the first order's link.
  const untouched = (await asAdmin('GET', `/api/venmo/admin/orders/${second.json.order.id}`)).json.order;
  assert.equal(untouched.status, 'pending');
});

test('the admin dashboard approve is idempotent', async () => {
  const { json } = await placeOrderWithProof({ email: 'double@example.com' });
  const id = json.order.id;
  const deliveriesBefore = emailsMatching('Your Greyfire files are ready').length;

  const first = await asAdmin('PATCH', `/api/venmo/admin/orders/${id}`, { status: 'delivered' });
  assert.equal(first.json.order.status, 'delivered');
  assert.equal(first.json.order.deliveryEmail.status, 'sent');

  const second = await asAdmin('PATCH', `/api/venmo/admin/orders/${id}`, { status: 'delivered' });
  assert.equal(second.json.order.status, 'delivered');
  assert.equal(second.json.order.deliveryEmail.status, 'sent');
  assert.equal(emailsMatching('Your Greyfire files are ready').length, deliveriesBefore + 1);
});

test('deliberately re-sending the delivery does not duplicate it', async () => {
  const { json } = await placeOrderWithProof({ email: 'nodelivery@example.com' });
  const id = json.order.id;
  await asAdmin('PATCH', `/api/venmo/admin/orders/${id}`, { status: 'delivered' });
  const count = emailsMatching('Your Greyfire files are ready').length;
  await asAdmin('PATCH', `/api/venmo/admin/orders/${id}`, { status: 'delivered' });
  await asAdmin('POST', `/api/venmo/admin/orders/${id}/verify`, {});
  assert.equal(emailsMatching('Your Greyfire files are ready').length, count);
});

test('the documented /api/orders and /api/admin aliases hit the same handlers', async () => {
  const created = await postForm(
    '/api/orders/checkout',
    {
      items: JSON.stringify([{ id: 'plan-basic-monthly' }]),
      buyer: JSON.stringify({ name: 'Alias', email: 'alias@example.com' }),
    },
    { field: 'proof', bytes: PNG_1PX, type: 'image/png', name: 'p.png' }
  );
  assert.equal(created.status, 201);
  const id = created.json.order.id;

  const unauth = await api('PATCH', `/api/admin/orders/${id}/status`, { status: 'delivered' });
  assert.equal(unauth.status, 401);

  const patched = await api('PATCH', `/api/admin/orders/${id}/status`, { status: 'delivered' }, auth);
  assert.equal(patched.json.order.status, 'delivered');
  assert.equal(patched.json.order.deliveryEmail.status, 'sent');

  // The email link was still unused, so it works — but it must not deliver twice.
  const deliveriesBefore = emailsMatching('Your Greyfire files are ready').length;
  const token = actionToken(id, 'approve');
  const viaAlias = await html(`${BASE}/api/orders/verify-action?token=${token}&action=approve`);
  assert.equal(viaAlias.status, 200);
  assert.match(viaAlias.body, /approved and files delivered/i);
  assert.equal(emailsMatching('Your Greyfire files are ready').length, deliveriesBefore);

  // ...and the token is now spent.
  assert.match((await html(`${BASE}/api/orders/verify-action?token=${token}&action=approve`)).body, /already actioned/i);
});

test('the admin alert can be re-sent with fresh links', async () => {
  const { json } = await placeOrderWithProof({ email: 'resend@example.com' });
  const id = json.order.id;
  const stale = actionToken(id, 'approve');

  const resend = await asAdmin('POST', `/api/venmo/admin/orders/${id}/alert`);
  assert.equal(resend.json.ok, true);

  const fresh = actionToken(id, 'approve');
  assert.notEqual(fresh, stale);
  // The superseded link is refused, the fresh one works.
  assert.equal((await html(tokenUrl(stale, 'approve'))).status, 409);
  const used = await html(tokenUrl(fresh, 'approve'));
  assert.equal(used.status, 200);
  assert.match(used.body, /approved and files delivered/i);
});

test('deleting an asset removes the file and blocks future downloads', async () => {
  const { json } = await placeOrderWithProof({ email: 'delete@example.com' });
  const id = json.order.id;
  const token = actionToken(id, 'approve');
  await html(tokenUrl(token, 'approve'));

  const delivered = (await asAdmin('GET', `/api/venmo/admin/orders/${id}`)).json.order;
  const granted = delivered.delivery.find((entry) => entry.assetId);
  assert.ok(granted);
  assert.equal((await fetch(`${BASE}${granted.url}`)).status, 200);

  const removed = await asAdmin('DELETE', `/api/venmo/admin/assets/${granted.assetId}`);
  assert.equal(removed.json.ok, true);
  assert.equal((await fetch(`${BASE}${granted.url}`)).status, 404);
  assert.equal((await asAdmin('DELETE', `/api/venmo/admin/assets/${granted.assetId}`)).status, 404);
  assert.equal((await api('GET', '/api/venmo/admin/assets')).status, 401);
});
