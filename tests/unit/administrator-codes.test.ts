import { expect, it } from 'vitest';
import { AdministratorSecurityCommandSchema } from '../../src/core/validation/administrator-security';
import { AdministratorOtpSchema } from '../../src/core/validation/administrator-codes';
it.each(['123456', '000000'])('accepts complete OTP %s', (code) =>
  expect(AdministratorOtpSchema.parse(code)).toBe(code),
);
it.each(['12345', '1234567', '12 3456', 'abcdef', '1e1234'])('rejects invalid OTP %s', (code) =>
  expect(AdministratorOtpSchema.safeParse(code).success).toBe(false),
);
it('never accepts a client-selected recipient or a verification success flag', () => {
  expect(
    AdministratorSecurityCommandSchema.safeParse({
      action: 'email-send',
      email: 'other@example.com',
    }).success,
  ).toBe(false);
  expect(
    AdministratorSecurityCommandSchema.safeParse({
      action: 'totp-confirm',
      code: '123456',
      verified: true,
    }).success,
  ).toBe(false);
  expect(
    AdministratorSecurityCommandSchema.safeParse({ action: 'email-prepare', password: 'secret' })
      .success,
  ).toBe(true);
});
