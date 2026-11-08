import { expect, it } from 'vitest';
import { isValidIban } from '../../src/core/domain/iban';
import { SettingsSchema } from '../../src/core/validation/portal-organization';
it('validates IBAN checksum and requires a matching beneficiary', () => {
  expect(isValidIban('BE68539007547034')).toBe(true);
  expect(isValidIban('FR1420041010050500013M02606')).toBe(true);
  expect(isValidIban('BE68539007547035')).toBe(false);
  expect(isValidIban('NOTANIBAN')).toBe(false);
  const base = {
    organizationId: crypto.randomUUID(),
    name: 'Club local',
    theme: 'SAGE',
    autoDeleteBankProof: true,
  };
  expect(
    SettingsSchema.safeParse({ ...base, bankIban: 'be68 5390 0754 7034', bankAccountName: 'Club' })
      .success,
  ).toBe(true);
  expect(
    SettingsSchema.safeParse({ ...base, bankIban: 'BE68539007547034', bankAccountName: null })
      .success,
  ).toBe(false);
  expect(SettingsSchema.safeParse({ ...base, bankIban: null, bankAccountName: null }).success).toBe(
    true,
  );
});
