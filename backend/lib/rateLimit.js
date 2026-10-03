export function createLimiter({ windowMs, max, key = (req) => req.ip }) {
  const hits = new Map();

  const sweep = () => {
    const now = Date.now();
    for (const [id, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(id);
    }
  };

  const timer = setInterval(sweep, windowMs);
  if (typeof timer.unref === 'function') timer.unref();

  const consume = (req) => {
    sweep();
    const id = key(req) || 'unknown';
    const now = Date.now();
    const entry = hits.get(id) || { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    hits.set(id, entry);
    return {
      ok: entry.count <= max,
      count: entry.count,
      remaining: Math.max(0, max - entry.count),
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      resetAt: entry.resetAt,
    };
  };

  const applyHeaders = (res, result) => {
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  };

  const reset = (req) => {
    hits.delete(key(req) || 'unknown');
  };

  const middleware = (req, res, next) => {
    const result = consume(req);
    applyHeaders(res, result);
    if (!result.ok) {
      res.setHeader('Retry-After', String(result.retryAfter));
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retry_after_seconds: result.retryAfter,
      });
    }
    return next();
  };

  middleware.consume = consume;
  middleware.applyHeaders = applyHeaders;
  middleware.reset = reset;
  return middleware;
}
