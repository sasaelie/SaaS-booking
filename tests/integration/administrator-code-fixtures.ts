import { createOTP } from '@better-auth/utils/otp';
import { base32 } from '@better-auth/utils/base32';
import { AdministratorOtpAdapter } from '../../src/adapters/auth/administrator-otp.adapter';
import { SimpleWebAuthnAdapter } from '../../src/adapters/auth/simple-webauthn.adapter';
import { DrizzleAdministratorCodesRepository } from '../../src/adapters/db/drizzle-administrator-codes.repository';
import { DrizzleAdministratorSecurityRepository } from '../../src/adapters/db/drizzle-administrator-security.repository';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
import type { PortalActor } from '../../src/core/ports/portal-models';
import { securityFixture } from './administrator-security-fixtures';
import { db } from './database';
export async function codeFixture() {
  const fixture = await securityFixture(),
    otp = new AdministratorOtpAdapter('Local-only-integration-otp-secret-123456789');
  const messages: { email: string; code: string; idempotencyKey: string }[] = [];
  const mail = {
    available: true,
    failed: false,
    send: async (actor: PortalActor, code: string, idempotencyKey: string) => {
      if (mail.failed) return failure(ERROR_CODES.INTERNAL_ERROR, 'TestMail', 'send');
      messages.push({ email: actor.email, code, idempotencyKey });
      return ok(undefined);
    },
  };
  const codes = new DrizzleAdministratorCodesRepository(db, otp, mail);
  const repository = new DrizzleAdministratorSecurityRepository(
    db,
    new SimpleWebAuthnAdapter('https://example.invalid'),
    codes,
  );
  return { ...fixture, passkeyRepository: fixture.repository, repository, otp, mail, messages };
}
export async function totpCode(secret: string, offset = 0) {
  const step = Math.floor(Date.now() / 30000) + offset;
  return createOTP(base32.decode(secret), { digits: 6, period: 30 }).hotp(step);
}
export async function prepareTotp(f: Awaited<ReturnType<typeof codeFixture>>, activate = true) {
  const secret = required(
    await f.repository.mutate(f.actor, { action: 'totp-prepare', password: 'test-only' }),
  ).totpSecret;
  if (!secret) throw Error('Setup secret required');
  const usedCode = await totpCode(secret);
  const proof = required(
    await f.repository.mutate(f.actor, { action: 'totp-confirm', code: usedCode }),
  );
  const recoveryCodes = proof.recoveryCodes ?? [];
  if (activate)
    required(
      await f.repository.mutate(f.actor, {
        action: 'activate',
        code: (recoveryCodes[0] ?? '').replaceAll('-', ''),
      }),
    );
  return { secret, recoveryCodes, usedCode };
}
export async function prepareEmail(f: Awaited<ReturnType<typeof codeFixture>>, activate = true) {
  required(await f.repository.mutate(f.actor, { action: 'email-prepare', password: 'test-only' }));
  const code = f.messages.at(-1)?.code ?? '';
  const proof = required(await f.repository.mutate(f.actor, { action: 'email-confirm', code }));
  const recoveryCodes = proof.recoveryCodes ?? [];
  if (activate)
    required(
      await f.repository.mutate(f.actor, {
        action: 'activate',
        code: (recoveryCodes[0] ?? '').replaceAll('-', ''),
      }),
    );
  return { code, recoveryCodes };
}
