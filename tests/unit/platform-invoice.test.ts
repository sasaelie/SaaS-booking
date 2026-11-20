import { describe, it, expect } from 'vitest';
import { invoiceAmounts, creditAmounts } from '../../src/core/domain/platform-invoice';
import {
  PlatformBillingSettingsSchema,
  IssuePlatformDocumentSchema,
} from '../../src/core/validation/platform-billing';
describe('platform commission documents', () => {
  it('splits a collected gross amount without adding another charge', () => {
    expect(invoiceAmounts(150, 2100)).toEqual({
      ok: true,
      value: { grossCents: 150, netCents: 124, taxCents: 26 },
    });
    expect(invoiceAmounts(150, 0)).toEqual({
      ok: true,
      value: { grossCents: 150, netCents: 150, taxCents: 0 },
    });
  });
  it('keeps cent rounding consistent when the last partial credit closes the invoice', () => {
    const original = { grossCents: 3, netCents: 2, taxCents: 1 };
    expect(creditAmounts(1, original, { grossCents: 2, netCents: 2, taxCents: 0 }, 2100)).toEqual({
      ok: true,
      value: { grossCents: 1, netCents: 0, taxCents: 1 },
    });
    expect(creditAmounts(4, original, { grossCents: 0, netCents: 0, taxCents: 0 }, 2100).ok).toBe(
      false,
    );
  });
  it('requires explicit issuer details, tax rules and confirmation', () => {
    expect(PlatformBillingSettingsSchema.safeParse({}).success).toBe(false);
    expect(
      IssuePlatformDocumentSchema.safeParse({
        kind: 'CREDIT',
        sourceId: crypto.randomUUID(),
        confirmed: false,
      }).success,
    ).toBe(false);
    for (const value of [-1, 0, 0.5, Number.NaN])
      expect(invoiceAmounts(value, 2100).ok).toBe(false);
  });
});
