import crypto from 'node:crypto';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function createAuth({ secret, username, password, ttlMs = TOKEN_TTL_MS }) {
  const signToken = (user) => {
    const payload = Buffer.from(
      JSON.stringify({ u: user, exp: Date.now() + ttlMs })
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  };

  const verifyToken = (token) => {
    if (!token) return null;
    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!safeEqual(sig, expected)) return null;
    try {
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (typeof claims.exp !== 'number' || claims.exp < Date.now()) return null;
      return claims;
    } catch {
      return null;
    }
  };

  const checkCredentials = (user, pass) =>
    safeEqual(user, username) && safeEqual(pass, password);

  const requireAuth = (req, res, next) => {
    const claims = verifyToken(req.headers.authorization?.replace(/^Bearer\s+/i, ''));
    if (!claims) return res.status(401).json({ error: 'Not authenticated.' });
    req.user = claims;
    return next();
  };

  return { signToken, verifyToken, checkCredentials, requireAuth };
}
