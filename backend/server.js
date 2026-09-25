import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-in-production';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'content.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

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
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function signToken(username) {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = String(token).split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof claims.exp !== 'number' || claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/content', (_req, res) => {
  res.json(readContent());
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: signToken(username) });
  }
  return res.status(401).json({ error: 'Invalid username or password.' });
});

app.put('/api/content', (req, res) => {
  const claims = verifyToken(req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  if (!claims) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const content = req.body?.content;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid content payload.' });
  }
  writeContent({ content, updated_at: new Date().toISOString() });
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Greyfire backend running on http://localhost:${PORT}`);
});