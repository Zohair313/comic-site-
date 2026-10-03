import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;
const DATA_DIR = path.join(os.tmpdir(), 'greyfire-venmo-test');
const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const INGEST_TOKEN = 'ingest-secret-123';

let server;
let auth = {};

function api(method, url, body, headers = {}) {
  return fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, json: await res.json().catch(() => ({})) }));
}

const login = (password = 'test123') => api('POST', '/api/auth/login', { username: 'admin', password });
const asAdmin = (method, url, body) => api(method, url, body, auth);
const ingest = (body) => api('POST', '/api/venmo/inbox', body, { 'X-Ingest-Token': INGEST_TOKEN });

function enableCheckout(extra = {}) {
  return asAdmin('PUT', '/api/venmo/admin/config', {
    enabled: true,
    handle: 'greyfire-studio',
    displayName: 'Greyfire Studio',
    accountEmail: 'pay@greyfirestudio.com',
    accountType: 'business',
    feeMode: 'add',
    feePercent: 10,
    noteTemplate: 'Greyfire {orderId}',
    ...extra,
  });
}

function placeOrder(items = [{ id: 'plan-basic-monthly', qty: 2 }], email = 'buyer@example.com') {
  return api('POST', '/api/venmo/orders', { items, buyer: { name: 'Ayesha', email } });
}

function spawnServer(port, extraEnv = {}) {
  const dataDir = path.join(os.tmpdir(), `greyfire-venmo-${port}`);
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });

  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      ADMIN_USER: 'admin',
      ADMIN_PASS: 'test123',
      AUTH_SECRET: 'test-secret-long',
      VENMO_INGEST_TOKEN: INGEST_TOKEN,
      VENMO_RATE_LIMIT_MAX: '200',
      DATA_FILE: path.join(dataDir, 'content.json'),
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server on ${port} did not start`)), 15000);
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('running on')) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server on ${port} exited with code ${code}`));
    });
  });
}

before(async () => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  server = await spawnServer(PORT, { DATA_FILE: path.join(DATA_DIR, 'content.json') });
  auth = { Authorization: `Bearer ${(await login()).json.token}` };
});

after(() => {
  server?.kill();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

test('health and content routes keep working', async () => {
  assert.equal((await api('GET', '/api/health')).json.ok, true);
  assert.equal((await api('GET', '/api/content')).status, 200);
  const saved = await api('PUT', '/api/content', { content: { site: { name: 'Greyfire Studio' } } }, auth);
  assert.equal(saved.json.ok, true);
});

test('login rejects a bad password and issues a token', async () => {
  assert.equal((await login('nope')).status, 401);
  assert.equal((await login()).status, 200);
});

test('config is disabled until a handle is set', async () => {
  const { json } = await api('GET', '/api/venmo/config');
  assert.equal(json.enabled, false);
  assert.equal(json.products.length, 3);
  const blocked = await placeOrder();
  assert.equal(blocked.status, 503);
});

test('admin config requires a token and never leaks the account email', async () => {
  assert.equal((await api('GET', '/api/venmo/admin/config')).status, 401);
  const { json } = await asAdmin('GET', '/api/venmo/admin/config');
  assert.equal(json.config.ingestConfigured, true);
  await enableCheckout();
  const pub = (await api('GET', '/api/venmo/config')).json;
  assert.equal(pub.enabled, true);
  assert.equal(pub.handle, 'greyfire-studio');
  assert.equal('accountEmail' in pub, false);
});

test('config ignores an invalid handle', async () => {
  await asAdmin('PUT', '/api/venmo/admin/config', { handle: 'not a handle!!' });
  const { json } = await api('GET', '/api/venmo/config');
  assert.equal(json.handle, 'greyfire-studio');
});

test('QR upload validates the image bytes and can be removed', async () => {
  const bad = await asAdmin('PUT', '/api/venmo/admin/config', { qrDataUrl: 'data:image/png;base64,bm90YW5pbWFnZQ==' });
  assert.equal(bad.status, 400);
  const good = await asAdmin('PUT', '/api/venmo/admin/config', { qrDataUrl: `data:image/png;base64,${PNG_1PX}` });
  assert.equal(good.json.config.qrUploaded, true);
  const qr = await fetch(`${BASE}/api/venmo/qr`);
  assert.equal(qr.status, 200);
  assert.equal(qr.headers.get('content-type'), 'image/png');
  const removed = await asAdmin('PUT', '/api/venmo/admin/config', { qrDataUrl: null });
  assert.equal(removed.json.config.qrUploaded, false);
  assert.equal((await api('GET', '/api/venmo/config')).json.qrUrl, null);
});

test('order total includes the fee and the note carries the order id', async () => {
  const { status, json } = await placeOrder();
  assert.equal(status, 201);
  assert.equal(json.order.totalCents, 1318);
  assert.match(json.order.paymentNote, /^Greyfire GF-[0-9A-Z]{6}$/);
  assert.equal(json.order.payoutCents, undefined);
  assert.ok(json.order.token.length > 20);
  assert.ok(json.payment.deepLink.includes('recipients=greyfire-studio'));
  assert.ok(json.payment.deepLink.includes('amount=13.18'));
});

test('the public config carries everything the checkout page renders', async () => {
  await enableCheckout();
  const { json } = await api('GET', '/api/venmo/config');
  for (const key of [
    'enabled',
    'handle',
    'displayName',
    'accountType',
    'noteTemplate',
    'instructions',
    'feeMode',
    'feePercent',
    'feeFixedCents',
    'allowPartial',
    'qrUrl',
    'products',
  ]) {
    assert.ok(key in json, `missing ${key}`);
  }
  assert.equal(json.feePercent, 10);
  assert.equal(json.feeMode, 'add');
  assert.equal('accountEmail' in json, false);
  for (const product of json.products) {
    for (const key of ['id', 'title', 'description', 'price', 'priceCents']) {
      assert.ok(key in product, `product missing ${key}`);
    }
  }
});

test('the buyer-facing summary matches the fee the server charges', async () => {
  const config = (await api('GET', '/api/venmo/config')).json;
  const product = config.products[0];
  const created = await placeOrder([{ id: product.id, qty: 2 }]);

  const feeCents =
    config.feeMode === 'add'
      ? Math.round((product.priceCents * 2 * config.feePercent) / 100) + config.feeFixedCents
      : 0;
  assert.equal(created.json.order.subtotalCents, product.priceCents * 2);
  assert.equal(created.json.order.totalCents, product.priceCents * 2 + feeCents);
  assert.equal(created.json.order.total, `$${((product.priceCents * 2 + feeCents) / 100).toFixed(2)}`);
});

test('the payment payload gives the buyer everything needed to pay', async () => {
  const { json } = await placeOrder([{ id: 'plan-basic-monthly' }]);
  for (const key of [
    'handle',
    'displayName',
    'currency',
    'amount',
    'amountCents',
    'note',
    'deepLink',
    'profileUrl',
    'qrUrl',
    'instructions',
  ]) {
    assert.ok(key in json.payment, `payment missing ${key}`);
  }
  assert.equal(json.payment.note, json.order.paymentNote);
  assert.equal(json.payment.amountCents, json.order.totalCents);
  assert.ok(json.payment.deepLink.startsWith('venmo://paycharge?'));
  assert.ok(json.payment.profileUrl.includes('greyfire-studio'));
  assert.equal(json.order.token.length > 20, true);
});

test('order creation validates the cart and the email', async () => {
  assert.equal((await placeOrder([])).status, 400);
  assert.equal((await placeOrder([{ id: 'does-not-exist' }])).status, 400);
  assert.equal((await placeOrder([{ id: 'plan-pro-monthly' }], 'bad-email')).status, 400);
});

test('buyer can only read their own order', async () => {
  const { json } = await placeOrder();
  const id = json.order.id;
  assert.equal((await api('GET', `/api/venmo/orders/${id}?token=wrong`)).status, 404);
  const mine = await api('GET', `/api/venmo/orders/${id}?token=${json.order.token}`);
  assert.equal(mine.json.order.status, 'pending');
  assert.deepEqual(mine.json.order.delivery, []);
  assert.equal('adminNote' in mine.json.order, false);
  assert.equal('email' in mine.json.order.buyer, false);
});

test('inbox requires the ingest token', async () => {
  assert.equal((await api('POST', '/api/venmo/inbox', { subject: 'x' })).status, 401);
  assert.equal((await api('POST', '/api/venmo/inbox', { subject: 'x' })).status, 401);
});

test('a wrong amount flags the order instead of confirming it', async () => {
  const { json } = await placeOrder();
  const { json: result } = await ingest({
    subject: `You received a payment of $5.00 from Mark Test for ${json.order.paymentNote}`,
    body: `Mark Test sent you a payment of $5.00\nNote: ${json.order.paymentNote}\nTransaction ID: 3988123456`,
  });
  assert.equal(result.reason, 'amount_mismatch');

  const admin = await asAdmin('GET', '/api/venmo/admin/orders');
  const order = admin.json.orders.find((o) => o.id === json.order.id);
  assert.equal(order.status, 'pending');
  assert.equal(order.needsReview, true);
  assert.equal(order.buyer.email, 'buyer@example.com');
  assert.ok(order.history.some((event) => event.reason === 'amount_mismatch'));
});

test('an email with no order id is rejected', async () => {
  const { status, json } = await ingest({ subject: 'You received a payment of $5.00' });
  assert.equal(status, 422);
  assert.equal(json.reason, 'no_order_id');
});

test('the exact amount auto-confirms the order and cannot run twice', async () => {
  const { json } = await placeOrder([{ id: 'plan-pro-monthly' }]);
  const note = json.order.paymentNote;
  const confirmed = await ingest({
    subject: 'You received a payment of $21.89 from Mark Test',
    body: `Mark Test sent you a payment of $21.89\nNote: ${note}\nTransaction ID: 3988123456`,
  });
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.json.ok, true);
  assert.equal(confirmed.json.status, 'paid');

  const again = await ingest({ subject: `payment of $21.89 ${note}` });
  assert.equal(again.json.reason, 'order_not_pending');

  const polled = await api('GET', `/api/venmo/orders/${json.order.id}?token=${json.order.token}`);
  assert.equal(polled.json.order.status, 'paid');
  assert.ok(polled.json.order.paidAt);
});

test('delivery links are filtered and the buyer sees them', async () => {
  const { json } = await placeOrder([{ id: 'plan-superstars-yearly' }]);
  const id = json.order.id;
  assert.equal((await api('PATCH', `/api/venmo/admin/orders/${id}`, { status: 'delivered' })).status, 401);

  const patched = await asAdmin('PATCH', `/api/venmo/admin/orders/${id}`, {
    delivery: [
      { label: 'Comic PDF', url: 'https://example.com/issue-1.pdf' },
      { label: 'bad link', url: 'javascript:alert(1)' },
    ],
    status: 'delivered',
  });
  assert.equal(patched.json.order.status, 'delivered');
  assert.deepEqual(patched.json.order.delivery, [{ label: 'Comic PDF', url: 'https://example.com/issue-1.pdf' }]);
  assert.ok(patched.json.order.deliveredAt);

  const polled = await api('GET', `/api/venmo/orders/${id}?token=${json.order.token}`);
  assert.equal(polled.json.order.delivery[0].label, 'Comic PDF');
});

test('an unknown order id cannot be patched', async () => {
  assert.equal((await asAdmin('GET', '/api/venmo/admin/orders/GF-XXXXXX')).status, 404);
  assert.equal((await asAdmin('PATCH', '/api/venmo/admin/orders/GF-XXXXXX', { status: 'paid' })).status, 404);
});

test('admin can confirm an order manually', async () => {
  const { json } = await placeOrder([{ id: 'plan-pro-monthly' }]);
  const verified = await asAdmin('POST', `/api/venmo/admin/orders/${json.order.id}/verify`, {
    payer: 'Bob Stone',
    transactionId: '998877',
  });
  assert.equal(verified.json.order.status, 'paid');
  assert.equal(verified.json.order.payment.payer, 'Bob Stone');
  const conflict = await asAdmin('POST', `/api/venmo/admin/orders/${json.order.id}/verify`, {});
  assert.equal(conflict.status, 409);
});

test('underpayment is rejected unless allowPartial is on', async () => {
  const { json } = await placeOrder([{ id: 'plan-pro-monthly' }]);
  const under = await asAdmin('POST', `/api/venmo/admin/orders/${json.order.id}/verify`, { amount: 1 });
  assert.equal(under.status, 422);
  assert.equal(under.json.reason, 'amount_mismatch');

  await asAdmin('PUT', '/api/venmo/admin/config', { allowPartial: true });
  const over = await asAdmin('POST', `/api/venmo/admin/orders/${json.order.id}/verify`, { amount: 50 });
  assert.equal(over.json.order.status, 'paid');
  await asAdmin('PUT', '/api/venmo/admin/config', { allowPartial: false });
});

test('order list supports search, filter and counts', async () => {
  const { json } = await placeOrder([{ id: 'plan-pro-monthly' }], 'searchable@example.com');
  const found = await asAdmin('GET', `/api/venmo/admin/orders?q=${json.order.paymentNote}`);
  assert.equal(found.json.total, 1);
  assert.equal(found.json.orders[0].id, json.order.id);

  const byEmail = await asAdmin('GET', '/api/venmo/admin/orders?q=searchable@example.com');
  assert.equal(byEmail.json.total, 1);

  const delivered = await asAdmin('GET', '/api/venmo/admin/orders?status=delivered');
  assert.ok(delivered.json.orders.every((order) => order.status === 'delivered'));
  assert.ok(delivered.json.counts.total > 1);
});

test('order creation is rate limited', async () => {
  const limited = await spawnServer(3198, { VENMO_RATE_LIMIT_MAX: '2' });
  try {
    const limitedApi = (method, url, body) =>
      fetch(`http://127.0.0.1:3198${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }).then(async (res) => ({ status: res.status, json: await res.json().catch(() => ({})) }));

    const config = await limitedApi('POST', '/api/auth/login', { username: 'admin', password: 'test123' });
    const headers = { Authorization: `Bearer ${config.json.token}` };
    await fetch('http://127.0.0.1:3198/api/venmo/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ enabled: true, handle: 'greyfire-studio' }),
    });

    const responses = [];
    for (let i = 0; i < 5; i += 1) {
      responses.push(
        await limitedApi('POST', '/api/venmo/orders', {
          items: [{ id: 'plan-pro-monthly' }],
          buyer: { email: 'spam@example.com' },
        })
      );
    }
    assert.equal(responses.filter((res) => res.status === 201).length, 2);
    const limited429 = responses.find((res) => res.status === 429);
    assert.ok(limited429);
    assert.ok(limited429.json.retry_after_seconds > 0);
  } finally {
    limited.kill();
    fs.rmSync(path.join(os.tmpdir(), 'greyfire-venmo-limit'), { recursive: true, force: true });
  }
});
