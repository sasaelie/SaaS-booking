import { randomBytes, randomInt, randomUUID, createHmac } from 'node:crypto';
import { createOTP } from '@better-auth/utils/otp';
import { base32 } from '@better-auth/utils/base32';
import { symmetricEncrypt, symmetricDecrypt, constantTimeEqual } from 'better-auth/crypto';
import { z } from 'zod';
import { ADMIN_CODES as C } from '../../config/administrator-codes';
import { ERROR_CODES, INPUT_LIMITS, TIME } from '../../config/constants';
import type { AdministratorOtpPort } from '../../core/ports/administrator-codes';
import type { PortalActor } from '../../core/ports/portal-models';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
const payload = z
  .object({
    userId: z.string(),
    purpose: z.literal('administrator-totp'),
    secret: z.string().regex(/^[A-Z2-7]+$/),
  })
  .strict();
export class AdministratorOtpAdapter implements AdministratorOtpPort {
  constructor(
    private readonly key: string,
    private readonly clock: () => number = Date.now,
  ) {}
  async prepareTotp(userId: string) {
    try {
      if (this.key.length < INPUT_LIMITS.SECRET_MIN)
        return failure(ERROR_CODES.CONFIGURATION_ERROR, 'AdministratorOtp', 'key');
      const secret = base32.encode(randomBytes(C.SECRET_BYTES), { padding: false });
      const ciphertext = await symmetricEncrypt({
        key: this.key,
        data: JSON.stringify({ userId, purpose: 'administrator-totp', secret }),
      });
      return ok({ secret, ciphertext });
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'AdministratorOtp', 'prepare');
    }
  }
  async verifyTotp(userId: string, ciphertext: string, code: string, lastStep: number) {
    try {
      const decoded = payload.parse(
        JSON.parse(await symmetricDecrypt({ key: this.key, data: ciphertext })),
      );
      if (decoded.userId !== userId)
        return failure(ERROR_CODES.OTP_INVALID, 'AdministratorOtp', 'owner');
      const otp = createOTP(base32.decode(decoded.secret), {
        digits: C.DIGITS,
        period: C.PERIOD_SECONDS,
      });
      const now = Math.floor(this.clock() / (C.PERIOD_SECONDS * TIME.SECOND_MS));
      let matched: number = C.INITIAL_COUNTER;
      for (let offset = -C.WINDOW; offset <= C.WINDOW; offset++) {
        const step = now + offset,
          expected = await otp.hotp(step);
        if (constantTimeEqual(code, expected) && step > lastStep) matched = Math.max(matched, step);
      }
      return matched >= 0
        ? ok(matched)
        : failure(ERROR_CODES.OTP_INVALID, 'AdministratorOtp', 'verify');
    } catch {
      return failure(ERROR_CODES.OTP_INVALID, 'AdministratorOtp', 'verify');
    }
  }
  prepareEmail(actor: PortalActor, purpose: string) {
    if (this.key.length < INPUT_LIMITS.SECRET_MIN) throw Error('Security key unavailable');
    const code = randomInt(0, C.RADIX ** C.DIGITS)
        .toString()
        .padStart(C.DIGITS, '0'),
      nonce = randomUUID();
    return { code, nonce, hash: this.emailHash(actor, purpose, code, nonce) };
  }
  verifyEmail(actor: PortalActor, purpose: string, code: string, nonce: string, hash: string) {
    return constantTimeEqual(hash, this.emailHash(actor, purpose, code, nonce));
  }
  private emailHash(actor: PortalActor, purpose: string, code: string, nonce: string) {
    return createHmac('sha256', this.key)
      .update(
        JSON.stringify([
          'administrator-email',
          actor.id,
          actor.sessionId,
          actor.email,
          purpose,
          nonce,
          code,
        ]),
      )
      .digest('hex');
  }
}
