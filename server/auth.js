import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.AUTH_SECRET || 'local-development-secret-change-me';
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createAccessToken(userId) {
  const payload = encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS });
  return `${payload}.${sign(payload)}`;
}

export function getAuthenticatedUserId(request) {
  const header = request.headers?.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const signaturesMatch = signature.length === expectedSignature.length
    && timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!signaturesMatch) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Math.floor(Date.now() / 1000) ? data.sub : null;
  } catch (error) {
    return null;
  }
}
