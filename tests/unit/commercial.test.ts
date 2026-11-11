import { expect, it } from 'vitest';
import { commercialQuote, effectivePlan, canUsePro } from '../../src/core/domain/commercial';
const now = new Date('2026-11-11T12:00:00Z');
const access = {
  organizationId: 'test',
  complimentary: false,
  suspendedAt: null,
  status: 'INACTIVE',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};
it('keeps the facial price, absorbs commission and has no cap', () => {
  const quote = commercialQuote({ plan: 'LIBERTE', amountCents: 3000 });
  expect(quote.ok && quote.value).toMatchObject({
    amountCents: 3000,
    commissionCents: 150,
    organizationNetCents: 2850,
  });
  const expensive = commercialQuote({ plan: 'LIBERTE', amountCents: 50000 });
  expect(expensive.ok && expensive.value.commissionCents).toBe(1795);
});
it('does not debit a fixed fee on fully credited/free bookings or Pro', () => {
  expect(commercialQuote({ plan: 'LIBERTE', amountCents: 0 })).toMatchObject({
    value: { commissionCents: 0 },
  });
  expect(commercialQuote({ plan: 'PRO', amountCents: 3000 })).toMatchObject({
    value: { commissionCents: 0, organizationNetCents: null },
  });
  expect(commercialQuote({ plan: 'LIBERTE', amountCents: 49 }).ok).toBe(false);
});
it('uses the cash amount after a voucher and a stable half-up rounding', () => {
  expect(commercialQuote({ plan: 'LIBERTE', amountCents: 1000 })).toMatchObject({
    value: { commissionCents: 80 },
  });
  expect(commercialQuote({ plan: 'LIBERTE', amountCents: 500 })).toMatchObject({
    value: { commissionCents: 63 },
  });
  expect(commercialQuote({ plan: 'LIBERTE', amountCents: -1 }).ok).toBe(false);
});
it('falls back to Liberte exactly at expiry, preserves complimentary/grace and prioritizes suspension', () => {
  expect(effectivePlan(access, now)).toBe('LIBERTE');
  expect(effectivePlan({ ...access, status: 'ACTIVE', currentPeriodEnd: now }, now)).toBe(
    'LIBERTE',
  );
  expect(effectivePlan({ ...access, complimentary: true }, now)).toBe('PRO');
  expect(canUsePro({ ...access, graceUntil: new Date(now.getTime() + 1) }, now)).toBe(true);
  expect(canUsePro({ ...access, complimentary: true, suspendedAt: now }, now)).toBe(false);
});
