import { describe, expect, it } from 'vitest';
import { PlatformFilterSchema } from '../../src/core/validation/portal-organization';
import { administrationPlan } from '../../src/core/domain/administration-plan';
import { accessIndicator } from '../../src/core/domain/status-indicator';
describe('administration filters', () => {
  it('keeps the paid plan visible when an administrator suspends access', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const access = {
      organizationId: 'example',
      complimentary: false,
      suspendedAt: now,
      status: 'ACTIVE',
      currentPeriodEnd: new Date('2026-12-17T12:00:00Z'),
      cancelAtPeriodEnd: false,
    };
    expect(administrationPlan(access, now)).toBe('PRO');
    expect(accessIndicator(access, now).tone).toBe('red');
  });
  it('uses bounded server pagination and trims organization searches', () => {
    expect(
      PlatformFilterSchema.parse({ search: '  atelier  ', pageSize: '50', page: '2' }),
    ).toMatchObject({ search: 'atelier', pageSize: 50, page: 2 });
    expect(PlatformFilterSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 25,
      status: '',
      plan: '',
    });
  });
  it('rejects unbounded pages, unsupported sizes and unknown sorting or status', () => {
    for (const value of [
      { page: 0 },
      { page: 1000001 },
      { pageSize: 500 },
      { sort: 'DROP TABLE' },
      { status: 'anything' },
      { plan: 'free' },
    ])
      expect(PlatformFilterSchema.safeParse(value).success).toBe(false);
  });
});
