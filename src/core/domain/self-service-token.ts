// src/core/domain/self-service-token.ts
import { ERROR_CODES } from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
export interface SelfCancelTokenPayload {
  readonly organizationId: string;
  readonly bookingId: string;
  readonly attendeeEmail: string;
  readonly expUnixSeconds: number;
}
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1)
    binary += String.fromCharCode(bytes[i] ?? 0);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
function fromBase64Url(base64Url: string): Uint8Array {
  const padded = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function computeHmacSha256(
  data: string,
  secret: string,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(signature);
}
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}
export async function signSelfCancelToken(
  payload: SelfCancelTokenPayload,
  secret: string,
): Promise<Result<string, AppError>> {
  if (secret.length < 16) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'SelfServiceToken',
      fn: 'signSelfCancelToken',
      cause: 'Clé secrète HMAC trop courte',
      received: `${secret.length} caractères`,
      expected: 'au moins 16 caractères',
    });
  }
  const encodedPayload = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const sigBytes = await computeHmacSha256(encodedPayload, secret);
  return ok(`${encodedPayload}.${toBase64Url(sigBytes)}`);
}
export async function verifySelfCancelToken(
  token: string,
  secret: string,
  now: Date,
): Promise<Result<SelfCancelTokenPayload, AppError>> {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return failAndLog({
      code: ERROR_CODES.UNAUTHORIZED,
      module: 'SelfServiceToken',
      fn: 'verifySelfCancelToken',
      cause: 'Format de jeton d’annulation invalide',
      received: token,
      expected: 'payloadBase64Url.signatureBase64Url',
    });
  }
  try {
    const expectedSig = await computeHmacSha256(parts[0], secret);
    const actualSig = fromBase64Url(parts[1]);
    if (!constantTimeEqual(expectedSig, actualSig)) {
      return failAndLog({
        code: ERROR_CODES.UNAUTHORIZED,
        module: 'SelfServiceToken',
        fn: 'verifySelfCancelToken',
        cause: 'Signature cryptographique HMAC invalide ou altérée',
        received: 'signature non concordante',
        expected: 'signature HMAC-SHA256 valide',
      });
    }
    const decodedJson = new TextDecoder().decode(fromBase64Url(parts[0]));
    const parsed = JSON.parse(decodedJson) as SelfCancelTokenPayload;
    const nowUnixSeconds = Math.floor(now.getTime() / 1000);
    if (nowUnixSeconds >= parsed.expUnixSeconds) {
      return failAndLog({
        code: ERROR_CODES.UNAUTHORIZED,
        module: 'SelfServiceToken',
        fn: 'verifySelfCancelToken',
        cause: 'Jeton d’annulation expiré',
        received: String(nowUnixSeconds),
        expected: `< ${parsed.expUnixSeconds}`,
      });
    }
    return ok(parsed);
  } catch (rawError: unknown) {
    return failAndLog({
      code: ERROR_CODES.UNAUTHORIZED,
      module: 'SelfServiceToken',
      fn: 'verifySelfCancelToken',
      cause: 'Décodage du jeton impossible',
      received: rawError instanceof Error ? rawError.message : String(rawError),
      expected: 'JSON Base64Url valide',
    });
  }
}
