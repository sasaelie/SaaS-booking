import { SignJWT, jwtVerify } from 'jose';
import type { PrivateFileTokenPort } from '../../core/ports/private-file.port';
import { PrivateFileKeySchema } from '../../core/validation/private-file';
import { PRIVATE_FILES } from '../../config/private-files';
import { ERROR_CODES, INPUT_LIMITS, PAYMENT_RULES, TIME } from '../../config/constants';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
export class PrivateFileTokenAdapter implements PrivateFileTokenPort {
  constructor(private readonly secret: string) {}
  async sign(key: string, expiresInSeconds: number) {
    if (
      !PrivateFileKeySchema.safeParse(key).success ||
      this.secret.length < INPUT_LIMITS.SECRET_MIN
    )
      return failure(ERROR_CODES.VALIDATION_FAILED, 'PrivateFile', 'sign');
    try {
      const expiry =
        Math.floor(Date.now() / TIME.SECOND_MS) +
        Math.min(expiresInSeconds, PAYMENT_RULES.PRESIGNED_URL_EXPIRY_SECONDS);
      const token = await new SignJWT({ key })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setAudience(PRIVATE_FILES.AUDIENCE)
        .setExpirationTime(expiry)
        .sign(new TextEncoder().encode(this.secret));
      return ok(token);
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'PrivateFile', 'sign');
    }
  }
  async verify(token: string) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(this.secret), {
        audience: PRIVATE_FILES.AUDIENCE,
        algorithms: ['HS256'],
      });
      const key = PrivateFileKeySchema.safeParse(payload['key']);
      return key.success ? ok(key.data) : failure(ERROR_CODES.UNAUTHORIZED, 'PrivateFile', 'key');
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'PrivateFile', 'verify');
    }
  }
}
