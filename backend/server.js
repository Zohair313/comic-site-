import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuth } from './lib/auth.js';
import { createLimiter } from './lib/rateLimit.js';
import { readJson } from './lib/store.js';
import { createOrderStore } from './lib/orders.js';
import { createAssetStore } from './lib/assets.js';
import { createStorage } from './lib/storage.js';
import { createActionTokens } from './lib/actionTokens.js';
import { createMailer } from './lib/mailer.js';
import { createVenmoRouter } from './routes/venmo.js';
import { createImageRouter } from './routes/images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Never overrides variables already present in the environment.
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3001;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-in-production';
const INGEST_TOKEN = process.env.VENMO_INGEST_TOKEN || '';
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'content.json');
const DATA_DIR = path.dirname(DATA_FILE);
const VENMO_FILE = process.env.VENMO_FILE || path.join(DATA_DIR, 'venmo.json');
const VENMO_ORDERS_FILE = process.env.VENMO_ORDERS_FILE || path.join(DATA_DIR, 'venmo-orders.json');
const VENMO_QR_FILE = process.env.VENMO_QR_FILE || path.join(DATA_DIR, 'venmo-qr.bin');
const VENMO_ASSETS_FILE = process.env.VENMO_ASSETS_FILE || path.join(DATA_DIR, 'assets.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');

const app = express();
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : Number(process.env.TRUST_PROXY) || 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const clampEnv = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

const loginLimiter = createLimiter({
  windowMs: clampEnv(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 1000, 86400000, 15 * 60 * 1000),
  max: clampEnv(process.env.LOGIN_RATE_LIMIT_MAX, 1, 100, 10),
});

const auth = createAuth({
  secret: AUTH_SECRET,
  username: ADMIN_USER,
  password: ADMIN_PASS,
});

function ensureDataFile() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ content: null, updated_at: null }));
  }
}

function readContent() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { content: null, updated_at: null };
  }
}

function writeContent(payload) {
  ensureDataFile();
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

const orderStore = createOrderStore(VENMO_ORDERS_FILE);
const assetStore = createAssetStore(VENMO_ASSETS_FILE);
const storage = createStorage(UPLOADS_DIR);
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const tokens = createActionTokens({ secret: AUTH_SECRET });
const mailer = createMailer({ outboxDir: path.join(DATA_DIR, 'mail-outbox') });

// Content images only. assets/ and screenshots/ hold paid goods and payment
// proofs — those stay behind the tokenised /admin and /download routes.
app.use(
  '/uploads/images',
  express.static(path.join(UPLOADS_DIR, 'images'), { index: false, dotfiles: 'deny', maxAge: '7d' })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/content', (_req, res) => {
  res.json(readContent());
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (auth.checkCredentials(username, password)) {
    loginLimiter.reset(req);
    return res.json({ token: auth.signToken(username) });
  }
  const budget = loginLimiter.consume(req);
  loginLimiter.applyHeaders(res, budget);
  if (!budget.ok) {
    res.setHeader('Retry-After', String(budget.retryAfter));
    return res.status(429).json({
      error: 'Too many failed sign-in attempts. Please try again later.',
      retry_after_seconds: budget.retryAfter,
    });
  }
  return res.status(401).json({ error: 'Invalid username or password.' });
});

app.put('/api/content', auth.requireAuth, (req, res) => {
  const content = req.body?.content;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid content payload.' });
  }
  writeContent({ content, updated_at: new Date().toISOString() });
  return res.json({ ok: true });
});

/**
 * Characters priced in the admin panel become orderable products. Ids match
 * the frontend's characterProductId() so a Lore buy button lines up with the
 * catalog the order endpoint validates against.
 */
function contentCharacterProducts() {
  const characters = readContent().content?.lore?.characters;
  if (!Array.isArray(characters)) return [];
  return characters
    .map((char) => {
      const title = String(char?.name ?? '').trim().slice(0, 120);
      const priceCents = Math.round(Number(char?.priceCents) || 0);
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      if (!title || !slug || priceCents <= 0) return null;
      const role = String(char?.role ?? '').trim().slice(0, 200);
      return {
        id: `char-${slug}`,
        title,
        description: role ? `${role} — downloadable character pack` : 'Downloadable character pack',
        priceCents,
        active: true,
      };
    })
    .filter(Boolean)
    .slice(0, 50);
}

const venmoRouter = createVenmoRouter({
  dataFile: VENMO_FILE,
  orderStore,
  assetStore,
  storage,
  tokens,
  mailer,
  qrFile: VENMO_QR_FILE,
  ingestToken: INGEST_TOKEN,
  requireAuth: auth.requireAuth,
  extraProducts: contentCharacterProducts,
});
app.use('/api/venmo', venmoRouter);
app.use('/api/admin/images', createImageRouter({ storage, requireAuth: auth.requireAuth }));

// The documented /api/orders + /api/admin surface, served by the same handlers.
const aliases = express.Router();
aliases.post('/api/orders/checkout', venmoRouter.aliases.checkout);
aliases.get('/api/orders/verify-action', venmoRouter.aliases.verifyAction);
aliases.patch('/api/admin/orders/:id/status', auth.requireAuth, venmoRouter.aliases.patchOrder);
app.use(aliases);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  const { handle, enabled } = readJson(VENMO_FILE, { config: {} }).config || {};
  console.log(`Greyfire backend running on http://localhost:${PORT}`);
  console.log(
    handle
      ? `Venmo: @${handle} (${enabled ? 'checkout enabled' : 'checkout disabled'})`
      : 'Venmo: no handle set yet (admin panel or VENMO_HANDLE)'
  );
  if (!INGEST_TOKEN) {
    console.log('Venmo inbox: off (set VENMO_INGEST_TOKEN to enable email auto-verify)');
  }
  const mail = mailer.config();
  console.log(
    mail.mode === 'smtp'
      ? `Mail: smtp via ${mail.host}:${mail.port}${mail.adminEmail ? ` -> ${mail.adminEmail}` : ' (set ADMIN_EMAIL)'}`
      : mail.mode === 'none'
        ? 'Mail: disabled (MAIL_TRANSPORT=none)'
        : 'Mail: console only (set SMTP_HOST to send real email)'
  );
  console.log(`Uploads: ${UPLOADS_DIR}`);
});
