import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { readJson, withLock, writeJson } from '../lib/store.js';
import { createLimiter } from '../lib/rateLimit.js';
import { formatCents, parseVenmoEmail, toCents } from '../lib/venmoMail.js';
import { detectImageMime, extForMime, sanitizeDisplayName } from '../lib/storage.js';
import { isAllowedAssetExtension, mimeForFilename } from '../lib/assets.js';
import { actionButton, escapeHtml, page } from '../lib/mailer.js';

const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ORDER_STATUSES = ['pending', 'paid', 'delivered', 'rejected', 'refunded', 'canceled'];
const ADMIN_STATUSES = ['pending', 'paid', 'delivered', 'rejected', 'refunded', 'canceled'];
const CLOSED_STATUSES = ['paid', 'delivered', 'rejected', 'refunded', 'canceled'];
const ACTIONS = ['approve', 'reject'];
const MAX_QR_BYTES = 1024 * 1024;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const MAX_ASSET_BYTES = 200 * 1024 * 1024;
const SCREENSHOT_DIR = 'screenshots';
const ASSET_DIR = 'assets';
const MAX_NOTE_LENGTH = 120;

const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROOF_BYTES, files: 1, fields: 24, fieldSize: 16 * 1024 },
});

const assetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ASSET_BYTES, files: 1, fields: 24, fieldSize: 16 * 1024 },
});

function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function parseField(uploader, field) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      uploader.single(field)(req, res, (error) => (error ? reject(error) : resolve()));
    });
}

function uploadFailure(error) {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, error: 'That file is too large.' };
  }
  if (typeof error?.code === 'string' && error.code.startsWith('LIMIT_')) {
    return { status: 400, error: 'That upload was rejected.' };
  }
  return null;
}

const DEFAULT_CONFIG = {
  enabled: false,
  currency: 'USD',
  handle: '',
  displayName: '',
  accountEmail: '',
  accountType: 'personal',
  noteTemplate: 'Greyfire order {orderId}',
  instructions:
    'Open Venmo, tap Pay, search the handle above, send the exact amount, and put the order number in the note. Your files are delivered as soon as the payment is confirmed.',
  feeMode: 'absorb',
  feePercent: 0,
  feeFixedCents: 0,
  allowPartial: false,
  autoConfirm: true,
  products: [
    {
      id: 'plan-basic-monthly',
      title: 'Basic Plan — Monthly',
      description: 'Home delivery, 5 comic books a month, limited asset downloads',
      priceCents: 599,
      active: true,
    },
    {
      id: 'plan-pro-monthly',
      title: 'Pro Plan — Monthly',
      description: 'Home delivery, 5 comic books a month, asset downloads, free comic arts',
      priceCents: 1990,
      active: true,
    },
    {
      id: 'plan-superstars-yearly',
      title: 'Superstars Plan — Yearly',
      description: 'Full year of comics, all asset downloads, free comic arts',
      priceCents: 2990,
      active: true,
    },
  ],
  updated_at: null,
};

function text(value, max = 200) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function multiline(value, max = 600) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
    .slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function isHandle(value) {
  return /^[A-Za-z0-9_-]{2,30}$/.test(String(value || '').trim());
}

function venmoHandle(value, max = 40) {
  return text(value, max).replace(/^@+/, '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, max);
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function toList(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function contentDisposition(filename, mode = 'attachment') {
  const safe = sanitizeDisplayName(filename, 'download');
  const ascii = safe.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, "'");
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function newOrderId() {
  let id = '';
  for (let i = 0; i < 6; i += 1) {
    id += ID_ALPHABET[crypto.randomInt(ID_ALPHABET.length)];
  }
  return `GF-${id}`;
}

function orderToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function buildNote(template, orderId) {
  const base = String(template || '').trim() || 'Order {orderId}';
  return base.replace(/\{orderId\}/g, orderId).replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE_LENGTH);
}

function computeTotals(config, items) {
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  let feeCents = 0;
  if (config.feeMode === 'add') {
    feeCents =
      Math.round((subtotalCents * clampNumber(config.feePercent, 0, 30, 0)) / 100) +
      clampNumber(config.feeFixedCents, 0, 5000, 0);
  }
  const totalCents = subtotalCents + feeCents;
  return { subtotalCents, feeCents, totalCents, payoutCents: totalCents - feeCents };
}

function amountMatches(config, reportedCents, totalCents) {
  if (!Number.isFinite(reportedCents)) return false;
  if (reportedCents === totalCents) return true;
  return Boolean(config.allowPartial) && reportedCents > totalCents;
}

function decorateDelivery(order, entries, ctx) {
  return entries.map((entry) => {
    if (!entry.assetId) return entry;
    return { ...entry, url: ctx?.downloadUrlFor ? ctx.downloadUrlFor(order, entry.assetId) : null };
  });
}

function publicOrder(order, ctx = {}) {
  const delivered = ['paid', 'delivered'].includes(order.status);
  return {
    id: order.id,
    status: order.status,
    buyer: { name: order.buyer.name },
    items: order.items.map(({ productId, title, qty, priceCents }) => ({
      productId,
      title,
      qty,
      price: formatCents(priceCents, order.currency),
      priceCents,
    })),
    currency: order.currency,
    subtotal: formatCents(order.subtotalCents, order.currency),
    subtotalCents: order.subtotalCents,
    fee: formatCents(order.feeCents, order.currency),
    feeCents: order.feeCents,
    total: formatCents(order.totalCents, order.currency),
    totalCents: order.totalCents,
    paymentNote: order.paymentNote,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    delivery: delivered ? decorateDelivery(order, order.delivery || [], ctx) : [],
    needsReview: order.needsReview,
    hasProof: Boolean(order.proof),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function adminOrder(order, ctx = {}) {
  return {
    ...publicOrder(order, ctx),
    buyer: order.buyer,
    payout: formatCents(order.payoutCents, order.currency),
    payoutCents: order.payoutCents,
    payment: order.payment,
    proof: order.proof
      ? {
          uploaded: true,
          filename: order.proof.filename,
          mime: order.proof.mime,
          size: order.proof.size,
          uploadedAt: order.proof.uploadedAt,
          url: '/api/venmo/admin/orders/' + encodeURIComponent(order.id) + '/proof',
        }
      : { uploaded: false },
    deliveryEmail: order.deliveryEmail || null,
    alert: order.alert || null,
    actions: Object.fromEntries(
      ACTIONS.map((action) => [
        action,
        order.actions?.[action] ? { usedAt: order.actions[action].usedAt || null } : null,
      ])
    ),
    adminNote: order.adminNote,
    history: order.history,
  };
}

function sanitizeProducts(input) {
  if (!Array.isArray(input)) return DEFAULT_CONFIG.products;
  return input
    .map((item) => ({
      id: text(item?.id, 60).replace(/[^A-Za-z0-9_-]/g, ''),
      title: text(item?.title, 120),
      description: text(item?.description, 300),
      priceCents: clampNumber(item?.priceCents ?? item?.price, 0, 1000000, 0),
      active: item?.active !== false,
    }))
    .filter((item) => item.id && item.title && item.priceCents > 0)
    .slice(0, 50);
}

function sanitizeConfig(input, current) {
  const next = { ...current };
  if ('enabled' in input) next.enabled = Boolean(input.enabled);
  if ('currency' in input) next.currency = text(input.currency, 3).toUpperCase() || 'USD';
  if ('handle' in input) {
    const handle = text(input.handle, 30).replace(/^@/, '');
    next.handle = isHandle(handle) ? handle : current.handle;
  }
  if ('displayName' in input) next.displayName = text(input.displayName, 80);
  if ('accountEmail' in input) {
    const email = text(input.accountEmail, 120);
    next.accountEmail = isEmail(email) ? email : current.accountEmail;
  }
  if ('accountType' in input) {
    next.accountType = input.accountType === 'business' ? 'business' : 'personal';
  }
  if ('noteTemplate' in input) next.noteTemplate = text(input.noteTemplate, MAX_NOTE_LENGTH);
  if ('instructions' in input) next.instructions = multiline(input.instructions, 600);
  if ('feeMode' in input) next.feeMode = input.feeMode === 'add' ? 'add' : 'absorb';
  if ('feePercent' in input) next.feePercent = clampNumber(input.feePercent, 0, 30, current.feePercent);
  if ('feeFixedCents' in input) {
    next.feeFixedCents = Math.round(clampNumber(input.feeFixedCents, 0, 5000, current.feeFixedCents));
  }
  if ('allowPartial' in input) next.allowPartial = Boolean(input.allowPartial);
  if ('autoConfirm' in input) next.autoConfirm = Boolean(input.autoConfirm);
  if ('products' in input) next.products = sanitizeProducts(input.products);
  return next;
}

function envOverrides() {
  const out = {};
  if (process.env.VENMO_ENABLED === 'true') out.enabled = true;
  if (process.env.VENMO_HANDLE) out.handle = process.env.VENMO_HANDLE.trim().replace(/^@/, '');
  if (process.env.VENMO_DISPLAY_NAME) out.displayName = process.env.VENMO_DISPLAY_NAME.trim();
  if (process.env.VENMO_ACCOUNT_EMAIL) out.accountEmail = process.env.VENMO_ACCOUNT_EMAIL.trim();
  if (process.env.VENMO_ACCOUNT_TYPE) {
    out.accountType = process.env.VENMO_ACCOUNT_TYPE === 'business' ? 'business' : 'personal';
  }
  if (process.env.VENMO_NOTE_TEMPLATE) out.noteTemplate = process.env.VENMO_NOTE_TEMPLATE.trim();
  if (process.env.VENMO_FEE_MODE) out.feeMode = process.env.VENMO_FEE_MODE === 'add' ? 'add' : 'absorb';
  if (process.env.VENMO_FEE_PERCENT) out.feePercent = Number(process.env.VENMO_FEE_PERCENT) || 0;
  if (process.env.VENMO_FEE_FIXED_CENTS) {
    out.feeFixedCents = Math.round(Number(process.env.VENMO_FEE_FIXED_CENTS) || 0);
  }
  return out;
}

export function createVenmoRouter({
  dataFile,
  orderStore,
  assetStore,
  storage,
  tokens,
  mailer,
  qrFile,
  ingestToken,
  requireAuth,
  extraProducts = () => [],
}) {
  const router = express.Router();
  const configLock = withLock();
  const orderLimit = clampNumber(process.env.VENMO_RATE_LIMIT_MAX, 1, 500, 8);
  const orderWindowMs = clampNumber(process.env.VENMO_RATE_LIMIT_WINDOW_MS, 1000, 3600000, 10 * 60 * 1000);
  const createOrderLimiter = createLimiter({ windowMs: orderWindowMs, max: orderLimit });
  const lookupLimiter = createLimiter({ windowMs: 60000, max: 120 });
  const readProof = parseField(proofUpload, 'proof');
  const readAsset = parseField(assetUpload, 'file');

  // Content-defined products (priced characters) share the plan catalog.
  const catalogFor = (config) => {
    const merged = new Map();
    for (const product of [...(config.products || []), ...extraProducts()]) {
      const id = text(product?.id, 60).replace(/[^A-Za-z0-9_-]/g, '');
      const title = text(product?.title, 120);
      const priceCents = clampNumber(product?.priceCents, 0, 1000000, 0);
      if (!id || !title || priceCents <= 0 || product?.active === false) continue;
      merged.set(id, { id, title, description: text(product?.description, 300), priceCents });
    }
    return merged;
  };

  const loadConfig = () => {
    const stored = readJson(dataFile, { config: DEFAULT_CONFIG });
    const config = { ...DEFAULT_CONFIG, ...stored.config };
    for (const [key, value] of Object.entries(envOverrides())) {
      const current = config[key];
      const isEmpty = current === '' || current === null || current === undefined;
      if (isEmpty || current === false || current === 0) config[key] = value;
    }
    if (!isHandle(config.handle)) config.handle = '';
    if (!isEmail(config.accountEmail)) config.accountEmail = '';
    return config;
  };

  const saveConfig = (config) => {
    const next = { ...config, updated_at: new Date().toISOString() };
    writeJson(dataFile, { config: next });
    return next;
  };

  const loadOrders = () => orderStore.load();
  const findOrder = (orders, id) => orderStore.find(orders, id);

  const ctx = {
    downloadUrlFor: (order, assetId) =>
      `/api/venmo/download/${encodeURIComponent(assetId)}?token=${encodeURIComponent(
        tokens.issueDownload(order.id, assetId)
      )}`,
  };

  const logEvent = (order, action, extra = {}) => {
    const now = new Date().toISOString();
    order.updatedAt = now;
    order.history = [...(order.history || []), { at: now, action, ...extra }].slice(-50);
  };

  const setStatus = (order, status, extra = {}) => {
    const from = order.status;
    order.status = status;
    if (status === 'paid' && !order.paidAt) order.paidAt = new Date().toISOString();
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date().toISOString();
    }
    logEvent(order, 'status_changed', { from, to: status, ...extra });
  };

  const deliveryLinks = (order) =>
    (order.delivery || [])
      .filter((entry) => entry.url || entry.assetId)
      .map((entry) => ({
        label: entry.label,
        href: entry.url || ctx.downloadUrlFor(order, entry.assetId),
      }));

  const deliveryExpiry = () => new Date(Date.now() + tokens.downloadTtlMs).toISOString();

  /**
   * Marks the order paid, attaches every asset its products entitle the buyer to,
   * and flags that the delivery email still has to go out. Mail is sent by the
   * caller after the lock is released; `deliveryEmail.status === 'sending'` is the
   * cross-process guard that keeps a double approve from sending twice.
   */
  const applyDelivery = (order, by) => {
    if (order.status === 'pending') setStatus(order, 'paid', { by, note: 'payment approved' });
    const manual = (order.delivery || []).filter((entry) => entry.url);
    const granted = assetStore
      .resolveForOrder(assetStore.load(), order.items)
      .filter((asset) => !manual.some((entry) => entry.assetId === asset.id))
      .map((asset) => ({ label: asset.label, assetId: asset.id }));
    order.delivery = [...manual, ...granted];
    setStatus(order, 'delivered', { by });
    const alreadySent = order.deliveryEmail?.status === 'sent';
    const inflight = order.deliveryEmail?.status === 'sending';
    return { granted: granted.length, notify: !alreadySent && !inflight };
  };

  const markEmail = async (orderId, patch, event) => {
    await orderStore.run((orders) => {
      const order = findOrder(orders, orderId);
      if (!order) return null;
      order.deliveryEmail = { ...(order.deliveryEmail || {}), ...patch };
      logEvent(order, event.action, event.details);
      return order;
    });
  };

  /** Approve -> paid + delivered + one buyer email. Safe to call repeatedly. */
  const deliverOrder = async (orderId, { by }) => {
    const staged = await orderStore.run((orders) => {
      const order = findOrder(orders, orderId);
      if (!order) return { error: 'not_found' };
      if (['refunded', 'canceled'].includes(order.status)) return { error: 'closed', order };
      const outcome = applyDelivery(order, by);
      if (outcome.notify) {
        order.deliveryEmail = { status: 'sending', startedAt: new Date().toISOString(), by };
      }
      return { notify: outcome.notify, order: structuredClone(order) };
    });

    if (staged.error) return staged;
    if (staged.notify) {
      const result = await mailer.buyerDelivery({
        order: staged.order,
        links: deliveryLinks(staged.order),
        expiresAt: deliveryExpiry(),
      });
      await markEmail(
        orderId,
        {
          status: result.ok ? 'sent' : 'failed',
          sentAt: result.ok ? new Date().toISOString() : null,
          error: result.ok ? null : result.reason || result.error || 'send_failed',
          by,
        },
        result.ok
          ? { action: 'delivery_email_sent', details: { by, links: staged.order.delivery?.length || 0 } }
          : { action: 'delivery_email_failed', details: { by, error: result.reason || result.error } }
      );
    }
    const orders = loadOrders();
    const order = findOrder(orders, orderId);
    return { error: order ? null : 'not_found', order: order ? adminOrder(order, ctx) : null };
  };

  const sendOrderAlert = async (orderId, { proofBuffer = null } = {}) => {
    const orders = loadOrders();
    const order = findOrder(orders, orderId);
    if (!order) return { ok: false, skipped: true, reason: 'not_found' };

    const approve = tokens.issueAction(order.id, 'approve');
    const reject = tokens.issueAction(order.id, 'reject');

    await orderStore.run((list) => {
      const found = findOrder(list, orderId);
      if (!found) return null;
      found.actions = {
        approve: { nonce: approve.nonce, expiresAt: approve.expiresAt, issuedAt: new Date().toISOString(), usedAt: null },
        reject: { nonce: reject.nonce, expiresAt: reject.expiresAt, issuedAt: new Date().toISOString(), usedAt: null },
      };
      logEvent(found, 'alert_tokens_issued', { approve: approve.expiresAt });
      return found;
    });

    let proof = null;
    if (proofBuffer) {
      proof = {
        filename: sanitizeDisplayName(order.proof?.filename, 'payment.png'),
        mime: order.proof?.mime || 'image/png',
        buffer: proofBuffer,
        cid: 'payment-proof',
      };
    }

    const result = await mailer.adminOrderAlert({
      order,
      approveUrl: `/api/venmo/verify-action?token=${encodeURIComponent(approve.token)}&action=approve`,
      rejectUrl: `/api/venmo/verify-action?token=${encodeURIComponent(reject.token)}&action=reject`,
      proof,
    });

    await orderStore.run((list) => {
      const found = findOrder(list, orderId);
      if (!found) return null;
      found.alert = {
        sentAt: result.ok ? new Date().toISOString() : null,
        ok: Boolean(result.ok),
        reason: result.reason || null,
      };
      logEvent(found, result.ok ? 'alert_sent' : 'alert_failed', { reason: result.reason || null });
      return found;
    });
    return result;
  };

  const applyPaymentReport = (orders, config, report) => {
    const order = report.orderId
      ? findOrder(orders, report.orderId)
      : orders.find((o) => o.status === 'pending' && report.noteMatches?.(o.paymentNote));

    if (!order) {
      return { ok: false, reason: 'order_not_found' };
    }
    if (order.status !== 'pending') {
      return { ok: false, reason: 'order_not_pending', order };
    }

    order.payment = {
      ...(order.payment || {}),
      reportedAmountCents: report.amountCents ?? null,
      payer: report.payer ?? order.payment?.payer ?? null,
      transactionId: report.transactionId ?? order.payment?.transactionId ?? null,
      reportedAt: new Date().toISOString(),
      source: report.source || 'email',
    };

    if (report.amountCents === null) {
      order.needsReview = true;
      logEvent(order, 'payment_reported', {
        by: report.source || 'email',
        reason: 'amount_unreadable',
        details: { candidates: report.amountCandidates || [] },
      });
      return { ok: false, reason: 'amount_unreadable', order };
    }

    if (!amountMatches(config, report.amountCents, order.totalCents)) {
      order.needsReview = true;
      logEvent(order, 'payment_reported', {
        by: report.source || 'email',
        reason: 'amount_mismatch',
        details: { reported: report.amountCents, expected: order.totalCents },
      });
      return { ok: false, reason: 'amount_mismatch', order };
    }

    order.needsReview = false;
    setStatus(order, 'paid', {
      by: report.source || 'email',
      transactionId: report.transactionId ?? null,
      amountCents: report.amountCents,
    });
    return { ok: true, reason: 'confirmed', order };
  };

  const publicConfig = (config) => ({
    enabled: Boolean(config.enabled && config.handle),
    currency: config.currency,
    handle: config.handle,
    displayName: config.displayName,
    accountType: config.accountType,
    noteTemplate: config.noteTemplate,
    instructions: config.instructions,
    feeMode: config.feeMode,
    feePercent: config.feePercent,
    feeFixedCents: config.feeFixedCents,
    allowPartial: config.allowPartial,
    qrUrl: fs.existsSync(qrFile) ? '/api/venmo/qr' : null,
    maxProofBytes: MAX_PROOF_BYTES,
    products: (config.products || [])
      .filter((product) => product.active)
      .map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: formatCents(product.priceCents, config.currency),
        priceCents: product.priceCents,
      })),
  });

  const paymentPayload = (config, order) => ({
    handle: config.handle,
    displayName: config.displayName,
    accountType: config.accountType,
    currency: order.currency,
    amount: formatCents(order.totalCents, order.currency),
    amountCents: order.totalCents,
    note: order.paymentNote,
    deepLink: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(config.handle)}&amount=${(order.totalCents / 100).toFixed(2)}&note=${encodeURIComponent(order.paymentNote)}`,
    profileUrl: `https://venmo.com/${encodeURIComponent(config.handle)}`,
    qrUrl: fs.existsSync(qrFile) ? '/api/venmo/qr' : null,
    instructions: config.instructions,
  });

  router.get('/config', (_req, res) => {
    res.json(publicConfig(loadConfig()));
  });

  router.get('/qr', (_req, res) => {
    if (!fs.existsSync(qrFile)) return res.status(404).json({ error: 'No QR code uploaded.' });
    const buffer = fs.readFileSync(qrFile);
    const mime = detectImageMime(buffer);
    if (!mime) return res.status(415).json({ error: 'Unsupported QR image.' });
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(buffer);
  });

  const checkout = wrap(async (req, res) => {
    const config = loadConfig();
    if (!config.enabled || !config.handle) {
      return res.status(503).json({ error: 'Venmo checkout is not available right now.' });
    }

    // Spend the rate-limit budget before buffering an upload.
    const budget = createOrderLimiter.consume(req);
    createOrderLimiter.applyHeaders(res, budget);
    if (!budget.ok) {
      res.setHeader('Retry-After', String(budget.retryAfter));
      return res.status(429).json({
        error: 'Too many orders from this connection. Please try again later.',
        retry_after_seconds: budget.retryAfter,
      });
    }

    if (String(req.headers['content-type'] || '').startsWith('multipart/form-data')) {
      try {
        await readProof(req, res);
      } catch (error) {
        const failure = uploadFailure(error);
        if (failure) return res.status(failure.status).json(failure);
        throw error;
      }
    }

    const parsedItems = parseJsonField(req.body?.items, []);
    const rawItems = Array.isArray(parsedItems) ? parsedItems : [];
    const catalog = catalogFor(config);
    const items = [];
    for (const raw of rawItems.slice(0, 20)) {
      const product = catalog.get(text(raw?.id ?? raw?.productId, 60));
      if (!product || product.active === false) continue;
      items.push({
        productId: product.id,
        title: product.title,
        priceCents: product.priceCents,
        qty: clampNumber(raw?.qty, 1, 99, 1),
      });
    }
    if (!items.length) {
      return res.status(400).json({ error: 'Your cart is empty or those items are unavailable.' });
    }

    const buyerIn = parseJsonField(req.body?.buyer, {});
    const email = text(req.body?.buyer?.email ?? buyerIn.email ?? req.body?.email, 120);
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const buyerName = text(req.body?.buyer?.name ?? buyerIn.name ?? req.body?.name, 80) || 'Customer';
    const buyerHandle = venmoHandle(req.body?.buyer?.handle ?? buyerIn.handle ?? req.body?.handle);
    const buyerTxn = text(req.body?.buyer?.transactionId ?? buyerIn.transactionId ?? req.body?.transactionId, 40);

    let proof = null;
    let proofBuffer = null;
    if (req.file) {
      const mime = detectImageMime(req.file.buffer);
      if (!mime) {
        return res.status(415).json({ error: 'Payment proof must be a JPEG, PNG or WebP image.' });
      }
      const stored = storage.save(req.file.buffer, {
        subdir: SCREENSHOT_DIR,
        ext: extForMime(mime),
        prefix: 'proof',
      });
      proofBuffer = req.file.buffer;
      proof = {
        storedName: stored.storedName,
        filename: sanitizeDisplayName(req.file.originalname, 'payment.png'),
        mime,
        size: stored.size,
        uploadedAt: new Date().toISOString(),
      };
    }

    const created = await orderStore.run((orders) => {
      let id = newOrderId();
      while (findOrder(orders, id)) id = newOrderId();
      const now = new Date().toISOString();
      const totals = computeTotals(config, items);
      const order = {
        id,
        token: orderToken(),
        status: 'pending',
        buyer: { name: buyerName, email, handle: buyerHandle || null, transactionId: buyerTxn || null },
        items,
        currency: config.currency,
        ...totals,
        paymentNote: buildNote(config.noteTemplate, id),
        payment: buyerTxn ? { transactionId: buyerTxn, payer: buyerHandle || null, source: 'buyer' } : null,
        proof,
        actions: {},
        alert: null,
        deliveryEmail: null,
        adminNote: '',
        delivery: [],
        needsReview: false,
        history: [{ at: now, action: 'created', items: items.length, proof: Boolean(proof) }],
        createdAt: now,
        updatedAt: now,
        paidAt: null,
        deliveredAt: null,
      };
      orders.push(order);
      return structuredClone(order);
    });

    // Never let a mail failure lose a real order.
    const alert = await sendOrderAlert(created.id, { proofBuffer });

    return res.status(201).json({
      order: { ...publicOrder(created, ctx), token: created.token },
      payment: paymentPayload(config, created),
      notified: Boolean(alert?.ok),
    });
  });
  router.post('/orders', checkout);

  router.get('/orders/:id', lookupLimiter, (req, res) => {
    const token = req.query.token || req.headers['x-order-token'];
    const orders = loadOrders();
    const order = findOrder(orders, req.params.id);
    if (!order || !safeEqual(token, order.token)) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json({ order: publicOrder(order, ctx) });
  });

  /** Token-checked download for a purchased asset. Never guessable, expiring. */
  router.get('/download/:assetId', lookupLimiter, (req, res) => {
    const claims = tokens.verifyDownload(text(req.query.token, 500));
    if (!claims || claims.assetId !== String(req.params.assetId)) {
      return res.status(403).json({ error: 'This download link is invalid or has expired.' });
    }
    const order = findOrder(loadOrders(), claims.orderId);
    const granted =
      order &&
      ['paid', 'delivered'].includes(order.status) &&
      (order.delivery || []).some((entry) => entry.assetId === claims.assetId);
    if (!granted) return res.status(403).json({ error: 'This download link is not valid for that order.' });

    const asset = assetStore.find(assetStore.load(), claims.assetId);
    if (!asset || !asset.storedName || !storage.exists(ASSET_DIR, asset.storedName)) {
      return res.status(404).json({ error: 'That file is no longer available. Please contact support.' });
    }

    res.setHeader('Content-Type', asset.mime || mimeForFilename(asset.filename));
    res.setHeader('Content-Disposition', contentDisposition(asset.filename));
    res.setHeader('Cache-Control', 'private, no-store');
    orderStore
      .run((orders) => {
        const found = findOrder(orders, claims.orderId);
        if (found) logEvent(found, 'asset_downloaded', { assetId: asset.id });
        return found;
      })
      .catch(() => {});
    return storage.createReadStream(ASSET_DIR, asset.storedName).pipe(res);
  });

  /** Human-facing landing page for the approve/reject links in the admin email. */
  const verifyAction = wrap(async (req, res) => {
      const send = (status, html) => res.status(status).type('html').send(html);

      const claims = tokens.verifyAction(text(req.query.token, 600));
      if (!claims || !ACTIONS.includes(claims.action)) {
        return send(
          400,
          page({
            title: 'Link expired',
            heading: 'This link is no longer valid',
            body: '<p>Order action links work once and expire after 72 hours.</p><p>Open the admin panel to finish this order.</p>',
          })
        );
      }
      const requested = text(req.query.action, 20);
      if (requested && requested !== claims.action) {
        return send(400, page({ title: 'Link mismatch', heading: 'This link does not match that action' }));
      }
      const action = claims.action;

      const consumed = await orderStore.run((orders) => {
        const order = findOrder(orders, claims.orderId);
        if (!order) return { error: 'not_found' };
        const slot = order.actions?.[action];
        if (!slot || slot.nonce !== claims.nonce) return { error: 'superseded' };
        if (slot.usedAt) return { error: 'already_used', order: publicOrder(order, ctx) };

        slot.usedAt = new Date().toISOString();
        logEvent(order, 'action_link_used', { action, by: 'email' });

        if (action === 'reject') {
          if (!CLOSED_STATUSES.includes(order.status)) setStatus(order, 'rejected', { by: 'email' });
          return { rejected: true, order: structuredClone(order) };
        }
        return { approved: true, orderId: order.id };
      });

      if (consumed.error === 'not_found') {
        return send(404, page({ title: 'Order not found', heading: 'We could not find that order' }));
      }
      if (consumed.error === 'superseded') {
        return send(
          409,
          page({
            title: 'Link replaced',
            heading: 'A newer link was already sent',
            body: '<p>Use the most recent email for this order, or finish it from the admin panel.</p>',
          })
        );
      }
      if (consumed.error === 'already_used') {
        const order = consumed.order;
        return send(
          200,
          page({
            title: 'Already handled',
            heading: 'This order was already actioned',
            body: `<p>Order <strong>${escapeHtml(order.id)}</strong> is currently
              <strong>${escapeHtml(order.status)}</strong>. Nothing was changed or sent again.</p>`,
          })
        );
      }

      if (action === 'reject') {
        const result = await mailer.buyerRejection({ order: consumed.order, note: '' });
        return send(
          200,
          page({
            title: 'Order rejected',
            heading: 'Payment marked as not received',
            body: `<p>Order <strong>${escapeHtml(consumed.order.id)}</strong> was rejected${
              result.ok ? ' and the buyer was emailed' : ''
            }.</p><p>If that was a mistake, reopen the order in the admin panel.</p>`,
          })
        );
      }

      const result = await deliverOrder(consumed.orderId, { by: 'email' });
      if (result.error) {
        return send(404, page({ title: 'Order not found', heading: 'We could not find that order' }));
      }
      const order = result.order;
      const emailState = order.deliveryEmail?.status;
      return send(
        200,
        page({
          title: 'Order approved',
          heading: 'Payment approved and files delivered',
          body: `<p>Order <strong>${escapeHtml(order.id)}</strong> from
              <strong>${escapeHtml(order.buyer?.name || 'a customer')}</strong>
              (${escapeHtml(order.total)}) is now <strong>delivered</strong>.</p>
            <p>${order.delivery?.length || 0} download link(s) attached.${
              emailState === 'sent'
                ? ' The buyer has been emailed.'
                : emailState === 'failed'
                  ? ' <strong>The delivery email could not be sent — resend it from the admin panel.</strong>'
                  : ''
            }</p>`,
        actions: actionButton('/admin', 'Open the admin panel', '#141210'),
      })
    );
  });
  router.get('/verify-action', lookupLimiter, verifyAction);

  router.post(
    '/inbox',
    wrap(async (req, res) => {
      if (!ingestToken) return res.status(503).json({ error: 'Ingest is not configured.' });
      const provided =
        req.headers['x-ingest-token'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!safeEqual(provided, ingestToken)) {
        return res.status(401).json({ error: 'Invalid ingest token.' });
      }

      const body = req.body || {};
      const hasEmail = Boolean(text(body.subject, 200) || text(body.body, 8000));
      const parsed = hasEmail
        ? parseVenmoEmail({ subject: body.subject, body: body.body, from: body.from })
        : { amountCandidates: [] };

      const report = {
        orderId: text(body.orderId, 20).toUpperCase() || parsed.orderId || null,
        amountCents: toCents(body.amount ?? body.amountCents / 100) ?? parsed.amountCents,
        amountCandidates: parsed.amountCandidates || [],
        payer: text(body.payer, 80) || parsed.payer || null,
        transactionId: text(body.transactionId, 40) || parsed.transactionId || null,
        source: 'email',
        noteMatches: (note) => text(body.memo ?? body.note, 120) === note,
      };

      if (!report.orderId && !text(body.memo ?? body.note, 120)) {
        return res.status(422).json({ ok: false, reason: 'no_order_id', error: 'No order number found in this email.' });
      }

      const outcome = await orderStore.run((orders) => {
        const config = loadConfig();
        const result = applyPaymentReport(orders, config, report);
        return result;
      });

      const order = outcome.order;
      const payload = {
        ok: Boolean(outcome.ok),
        reason: outcome.reason,
        order_id: order?.id ?? null,
        expected: order ? order.totalCents : null,
        reported: report.amountCents,
        status: order?.status ?? null,
      };
      if (!outcome.ok) return res.status(422).json(payload);
      return res.json(payload);
    })
  );

  router.get('/admin/config', requireAuth, (_req, res) => {
    const config = loadConfig();
    res.json({
      config: {
        ...config,
        feePercent: config.feePercent,
        qrUploaded: fs.existsSync(qrFile),
        ingestConfigured: Boolean(ingestToken),
        mailMode: mailer.mode(),
        mailConfigured: mailer.isConfigured(),
        adminEmail: mailer.config().adminEmail || null,
      },
    });
  });

  router.put(
    '/admin/config',
    requireAuth,
    wrap(async (req, res) => {
      const body = req.body || {};
      if ('qrDataUrl' in body) {
        if (body.qrDataUrl === null || body.qrDataUrl === '') {
          fs.rmSync(qrFile, { force: true });
        } else {
          const match = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
            String(body.qrDataUrl).trim()
          );
          if (!match) return res.status(400).json({ error: 'QR must be a base64 png, jpeg or webp image.' });
          const buffer = Buffer.from(match[1], 'base64');
          if (!buffer.length) return res.status(400).json({ error: 'QR image is empty.' });
          if (buffer.length > MAX_QR_BYTES) {
            return res.status(400).json({ error: 'QR image must be under 1 MB.' });
          }
          if (!detectImageMime(buffer)) {
            return res.status(400).json({ error: 'That file is not a valid png, jpeg or webp image.' });
          }
          fs.mkdirSync(path.dirname(qrFile), { recursive: true });
          const tmp = `${qrFile}.${process.pid}.tmp`;
          fs.writeFileSync(tmp, buffer);
          fs.renameSync(tmp, qrFile);
        }
      }

      const next = await configLock(async () => saveConfig(sanitizeConfig(body, loadConfig())));

      return res.json({
        ok: true,
        config: {
          ...next,
          qrUploaded: fs.existsSync(qrFile),
          ingestConfigured: Boolean(ingestToken),
          mailMode: mailer.mode(),
          mailConfigured: mailer.isConfigured(),
        },
      });
    })
  );

  router.get('/admin/assets', requireAuth, (_req, res) => {
    const assets = assetStore.load();
    res.json({
      assets: assets.map(({ storedName, ...rest }) => ({ ...rest, stored: Boolean(storedName) })),
    });
  });

  router.post(
    '/admin/assets',
    requireAuth,
    wrap(async (req, res) => {
      try {
        await readAsset(req, res);
      } catch (error) {
        const failure = uploadFailure(error);
        if (failure) return res.status(failure.status).json(failure);
        throw error;
      }
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Choose a file to upload.' });
      if (!isAllowedAssetExtension(file.originalname)) {
        return res.status(415).json({ error: 'That file type is not supported.' });
      }
      const known = assetStore.find(assetStore.load(), text(req.body?.id, 40));
      if (known) return res.status(409).json({ error: 'An asset with that id already exists.' });

      const stored = storage.save(file.buffer, { subdir: ASSET_DIR, ext: 'bin', prefix: 'asset' });
      const { asset } = assetStore.create({
        label: text(req.body?.label, 120) || sanitizeDisplayName(file.originalname, 'Digital file'),
        description: text(req.body?.description, 300),
        filename: sanitizeDisplayName(file.originalname, 'download'),
        storedName: stored.storedName,
        size: stored.size,
        mime: mimeForFilename(file.originalname),
        productIds: toList(req.body?.productIds),
      });
      const { storedName, ...safe } = asset;
      return res.status(201).json({ asset: { ...safe, stored: Boolean(storedName) } });
    })
  );

  router.patch(
    '/admin/assets/:id',
    requireAuth,
    wrap(async (req, res) => {
      const assets = assetStore.load();
      const asset = assetStore.update(assets, req.params.id, req.body || {});
      if (!asset) return res.status(404).json({ error: 'Asset not found.' });
      const { storedName, ...safe } = asset;
      return res.json({ asset: { ...safe, stored: Boolean(storedName) } });
    })
  );

  router.delete('/admin/assets/:id', requireAuth, (req, res) => {
    const assets = assetStore.load();
    const asset = assetStore.remove(assets, req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });
    if (asset.storedName) storage.remove(ASSET_DIR, asset.storedName);
    return res.json({ ok: true, id: asset.id });
  });

  router.get('/admin/orders', requireAuth, (req, res) => {
    const status = text(req.query.status, 20);
    const search = text(req.query.q, 120).toLowerCase();
    const limit = clampNumber(req.query.limit, 1, 200, 100);
    const offset = clampNumber(req.query.offset, 0, 100000, 0);

    const all = loadOrders();
    const counts = ORDER_STATUSES.reduce((acc, key) => {
      acc[key] = all.filter((order) => order.status === key).length;
      return acc;
    }, {});
    counts.total = all.length;

    const filtered = all
      .filter((order) => (status && status !== 'all' ? order.status === status : true))
      .filter((order) =>
        search
          ? [order.id, order.buyer?.email, order.buyer?.name, order.buyer?.handle, order.paymentNote]
              .join(' ')
              .toLowerCase()
              .includes(search)
          : true
      )
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    res.json({
      orders: filtered.slice(offset, offset + limit).map((order) => adminOrder(order, ctx)),
      counts,
      total: filtered.length,
    });
  });

  router.get('/admin/orders/:id', requireAuth, (req, res) => {
    const order = findOrder(loadOrders(), req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json({ order: adminOrder(order, ctx) });
  });

  router.get('/admin/orders/:id/proof', requireAuth, (req, res) => {
    const order = findOrder(loadOrders(), req.params.id);
    if (!order?.proof?.storedName || !storage.exists(SCREENSHOT_DIR, order.proof.storedName)) {
      return res.status(404).json({ error: 'No payment screenshot for this order.' });
    }
    res.setHeader('Content-Type', order.proof.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDisposition(order.proof.filename, 'inline'));
    res.setHeader('Cache-Control', 'private, no-store');
    return storage.createReadStream(SCREENSHOT_DIR, order.proof.storedName).pipe(res);
  });

  /** Re-issue the admin alert with fresh one-time links. */
  router.post(
    '/admin/orders/:id/alert',
    requireAuth,
    wrap(async (req, res) => {
      const order = findOrder(loadOrders(), req.params.id);
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      let proofBuffer = null;
      if (order.proof?.storedName && storage.exists(SCREENSHOT_DIR, order.proof.storedName)) {
        proofBuffer = storage.read(SCREENSHOT_DIR, order.proof.storedName);
      }
      const result = await sendOrderAlert(order.id, { proofBuffer });
      if (result.skipped && result.reason === 'no_admin_email') {
        return res.status(422).json({ error: 'Set ADMIN_EMAIL so alerts have somewhere to go.' });
      }
      return res.json({ ok: Boolean(result.ok), reason: result.reason || null });
    })
  );

  const patchOrder = wrap(async (req, res) => {
    const body = req.body || {};
    const staged = await orderStore.run((orders) => {
      const found = findOrder(orders, req.params.id);
      if (!found) return { error: 'not_found' };

      if ('delivery' in body) {
        if (body.delivery === null) {
          found.delivery = (found.delivery || []).filter((entry) => entry.assetId);
        } else if (Array.isArray(body.delivery)) {
          found.delivery = [
            ...(found.delivery || []).filter((entry) => entry.assetId),
            ...body.delivery
              .map((item) => ({
                label: text(item?.label, 80),
                url: text(item?.url, 500),
              }))
              .filter((item) => item.label && /^https?:\/\//i.test(item.url))
              .slice(0, 10),
          ];
        }
      }

      let shouldDeliver = false;
      if ('status' in body) {
        const status = text(body.status, 20);
        if (!ADMIN_STATUSES.includes(status)) return { error: 'bad_status' };
        if (status === 'delivered' && found.status !== 'delivered') shouldDeliver = true;
        if (!shouldDeliver) setStatus(found, status, { by: 'admin' });
      }

      if ('adminNote' in body) found.adminNote = text(body.adminNote, 1000);
      if ('transactionId' in body) {
        found.payment = { ...(found.payment || {}), transactionId: text(body.transactionId, 40) || null };
      }
      if ('payer' in body) {
        found.payment = { ...(found.payment || {}), payer: text(body.payer, 80) || null };
      }
      if ('needsReview' in body) found.needsReview = Boolean(body.needsReview);

      found.updatedAt = new Date().toISOString();
      return { shouldDeliver, orderId: found.id };
    });

    if (staged.error === 'not_found') return res.status(404).json({ error: 'Order not found.' });
    if (staged.error === 'bad_status') {
      return res.status(400).json({ error: 'Order not found or status is invalid.' });
    }

    // deliverOrder re-reads under the lock and owns the one-and-only delivery email.
    if (staged.shouldDeliver) await deliverOrder(staged.orderId, { by: 'admin' });

    const order = findOrder(loadOrders(), staged.orderId);
    return res.json({ order: adminOrder(order, ctx) });
  });

  router.patch('/admin/orders/:id', requireAuth, patchOrder);

  router.post(
    '/admin/orders/:id/verify',
    requireAuth,
    wrap(async (req, res) => {
      const body = req.body || {};
      const order = await orderStore.run((orders) => {
        const config = loadConfig();
        const found = findOrder(orders, req.params.id);
        if (!found) return { error: 'not_found' };
        if (found.status !== 'pending') return { error: 'not_pending', order: found };

        const amountCents = toCents(body.amount ?? body.amountCents / 100) ?? found.totalCents;
        return applyPaymentReport(orders, config, {
          orderId: found.id,
          amountCents,
          amountCandidates: [amountCents],
          payer: text(body.payer, 80) || found.buyer?.handle || null,
          transactionId: text(body.transactionId, 40) || found.buyer?.transactionId || null,
          source: 'admin',
        });
      });

      if (order.error === 'not_found') return res.status(404).json({ error: 'Order not found.' });
      if (order.error === 'not_pending') {
        return res.status(409).json({ error: `Order is already ${order.order.status}.` });
      }
      if (!order.ok) {
        return res.status(422).json({
          error: 'Payment could not be confirmed.',
          reason: order.reason,
          order: adminOrder(order.order, ctx),
        });
      }
      return res.json({ ok: true, order: adminOrder(order.order, ctx) });
    })
  );

  // Thin aliases so the documented /api/orders + /api/admin surface resolves here too.
  router.aliases = { checkout, verifyAction, patchOrder };

  return router;
}
