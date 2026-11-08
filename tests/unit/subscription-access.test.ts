import { expect, it } from 'vitest';
import {
  hasCommercialAccess,
  type OrganizationAccess,
} from '../../src/core/domain/subscription-access';
const end = new Date('2026-12-12T10:00:00Z');
const access: OrganizationAccess = {
  organizationId: 'org',
  complimentary: false,
  suspendedAt: null,
  status: 'ACTIVE',
  currentPeriodEnd: end,
  cancelAtPeriodEnd: true,
};
it('keeps every commercial right after cancellation until the exact paid-period boundary', () => {
  expect(hasCommercialAccess(access, new Date('2026-11-12T10:01:00Z'))).toBe(true);
  expect(hasCommercialAccess(access, new Date(end.getTime() - 1))).toBe(true);
  expect(hasCommercialAccess(access, end)).toBe(false);
  expect(hasCommercialAccess(access, new Date('2026-12-13T10:00:00Z'))).toBe(false);
});
it('accepts complimentary spaces and fails closed for unpaid, invalid or suspended access', () => {
  expect(
    hasCommercialAccess(
      { ...access, complimentary: true, currentPeriodEnd: null, status: 'INACTIVE' },
      end,
    ),
  ).toBe(true);
  expect(hasCommercialAccess({ ...access, suspendedAt: end, complimentary: true }, end)).toBe(
    false,
  );
  expect(hasCommercialAccess({ ...access, status: 'PAST_DUE' }, new Date('2026-11-13'))).toBe(
    false,
  );
  expect(hasCommercialAccess({ ...access, currentPeriodEnd: new Date('invalid') }, end)).toBe(
    false,
  );
});
