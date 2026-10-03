import crypto from 'node:crypto';

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 72;
const DEFAULT_DOWNLOAD_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/**
 * Stateless HMAC-signed tokens. The signature proves authenticity, while the
 * one-time guarantee for approve/reject comes from the consumed-nonce check the
 * caller performs against the stored order record.
 */
export function createActionTokens({ secret, ttlMs = DEFAULT_TTL_MS, downloadTtlMs = DEFAULT_DOWNLOAD_TTL_MS }) {
  if (!secret || String(secret).length < 8) {
    throw new Error('Action tokens require a secret of at least 8 characters.');
  }

  const sign = (payload) => {
    const body = base64url(JSON.stringify(payload));
    const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  };

  const open = (token) => {
    const raw = String(token || '');
    const dot = raw.lastIndexOf('.');
    if (dot <= 0) return null;
    const body = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (!safeEqual(sig, expected)) return null;
    try {
      const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (typeof claims.e !== 'number' || claims.e * 1000 < Date.now()) return null;
      if (!claims.o || !claims.a || !claims.n) return null;
      return claims;
    } catch {
      return null;
    }
  };

  return {
    ttlMs,
    downloadTtlMs,

    /** One-time admin action token (approve | reject). */
    issueAction(orderId, action, ttl = ttlMs) {
      const nonce = crypto.randomBytes(12).toString('base64url');
      return {
        nonce,
        expiresAt: new Date(Date.now() + ttl).toISOString(),
        token: sign({ o: String(orderId), a: String(action), n: nonce, e: Math.floor((Date.now() + ttl) / 1000) }),
      };
    },

    verifyAction(token, expectedAction) {
      const claims = open(token);
      if (!claims) return null;
      if (expectedAction && claims.a !== expectedAction) return null;
      return {
        orderId: claims.o,
        action: claims.a,
        nonce: claims.n,
        expiresAt: new Date(claims.e * 1000).toISOString(),
      };
    },

    /** Replayable download token bound to one order + one asset. */
    issueDownload(orderId, assetId, ttl = downloadTtlMs) {
      return sign({
        o: String(orderId),
        a: 'download',
        r: String(assetId),
        n: crypto.randomBytes(8).toString('base64url'),
        e: Math.floor((Date.now() + ttl) / 1000),
      });
    },

    verifyDownload(token) {
      const claims = open(token);
      if (!claims || claims.a !== 'download' || !claims.r) return null;
      return {
        orderId: claims.o,
        assetId: claims.r,
        expiresAt: new Date(claims.e * 1000).toISOString(),
      };
    },
  };
}
