const buckets = new Map();

const DEFAULT_LIMIT = {
  capacity: 60,
  refillPerMinute: 60,
  cost: 1,
};

function readHeader(request, headerName) {
  return request.headers?.[headerName] || request.headers?.[headerName.toLowerCase()] || '';
}

export function getClientIp(request) {
  const forwardedFor = readHeader(request, 'x-forwarded-for');

  if (forwardedFor) {
    return String(forwardedFor).split(',')[0].trim();
  }

  return (
    readHeader(request, 'x-real-ip') ||
    readHeader(request, 'cf-connecting-ip') ||
    request.socket?.remoteAddress ||
    'unknown'
  );
}

export function consumeRateLimit(request, options = {}) {
  const config = {
    ...DEFAULT_LIMIT,
    ...options,
  };
  const now = Date.now();
  const refillPerMs = config.refillPerMinute / 60000;
  const clientIp = getClientIp(request);
  const key = `${config.keyPrefix || 'global'}:${clientIp}`;
  const currentBucket = buckets.get(key) || {
    tokens: config.capacity,
    updatedAt: now,
  };
  const elapsedMs = now - currentBucket.updatedAt;
  const nextTokens = Math.min(config.capacity, currentBucket.tokens + elapsedMs * refillPerMs);
  const allowed = nextTokens >= config.cost;
  const remainingTokens = allowed ? nextTokens - config.cost : nextTokens;
  const resetInMs = Math.ceil(((config.capacity - remainingTokens) / refillPerMs) || 0);
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((config.cost - nextTokens) / refillPerMs / 1000));

  buckets.set(key, {
    tokens: remainingTokens,
    updatedAt: now,
  });

  cleanupBuckets(now);

  return {
    allowed,
    limit: config.capacity,
    remaining: Math.max(0, Math.floor(remainingTokens)),
    resetAt: new Date(now + resetInMs).toISOString(),
    retryAfterSeconds,
  };
}

export function applyRateLimitHeaders(response, result) {
  response.setHeader('RateLimit-Limit', String(result.limit));
  response.setHeader('RateLimit-Remaining', String(result.remaining));
  response.setHeader('RateLimit-Reset', result.resetAt);

  if (!result.allowed) {
    response.setHeader('Retry-After', String(result.retryAfterSeconds));
  }
}

function cleanupBuckets(now) {
  if (buckets.size < 1000) {
    return;
  }

  const inactiveLimitMs = 10 * 60 * 1000;

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.updatedAt > inactiveLimitMs) {
      buckets.delete(key);
    }
  }
}
