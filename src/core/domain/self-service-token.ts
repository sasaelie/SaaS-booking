import { ERROR_CODES, INPUT_LIMITS, TIME, TOKEN_RULES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import {
  SelfCancelPayloadSchema,
  SelfCancelTokenSchema,
  type SelfCancelTokenPayload,
} from '../validation/self-service';
export type { SelfCancelTokenPayload } from '../validation/self-service';
function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
function decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (character) =>
    character.charCodeAt(0),
  );
}
function hmacKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}
export async function signSelfCancelToken(
  payload: SelfCancelTokenPayload,
  secret: string,
): Promise<Result<string>> {
  if (
    secret.length < INPUT_LIMITS.SECRET_MIN ||
    !SelfCancelPayloadSchema.safeParse(payload).success
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'SelfServiceToken', 'sign');
  try {
    const body = encode(new TextEncoder().encode(JSON.stringify(payload)));
    const key = await hmacKey(secret, 'sign');
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${TOKEN_RULES.PURPOSE}.${body}`),
    );
    return ok(`${body}.${encode(new Uint8Array(signature))}`);
  } catch {
    return failure(ERROR_CODES.INTERNAL_ERROR, 'SelfServiceToken', 'sign');
  }
}
export async function verifySelfCancelToken(
  token: string,
  secret: string,
  now: Date,
): Promise<Result<SelfCancelTokenPayload>> {
  if (
    secret.length < INPUT_LIMITS.SECRET_MIN ||
    !SelfCancelTokenSchema.safeParse(token).success ||
    !Number.isFinite(now.getTime())
  )
    return failure(ERROR_CODES.UNAUTHORIZED, 'SelfServiceToken', 'verify');
  try {
    const [body, signature, extra] = token.split('.');
    if (!body || !signature || extra !== undefined)
      return failure(ERROR_CODES.UNAUTHORIZED, 'SelfServiceToken', 'verify');
    const key = await hmacKey(secret, 'verify');
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(decode(signature)),
      new TextEncoder().encode(`${TOKEN_RULES.PURPOSE}.${body}`),
    );
    if (!valid) return failure(ERROR_CODES.UNAUTHORIZED, 'SelfServiceToken', 'verify');
    const parsed = SelfCancelPayloadSchema.safeParse(
      JSON.parse(new TextDecoder().decode(decode(body))),
    );
    return parsed.success && now.getTime() < parsed.data.expUnixSeconds * TIME.SECOND_MS
      ? ok(parsed.data)
      : failure(ERROR_CODES.UNAUTHORIZED, 'SelfServiceToken', 'verify');
  } catch {
    return failure(ERROR_CODES.UNAUTHORIZED, 'SelfServiceToken', 'verify');
  }
}
