import { expect, it } from 'vitest';
import { CreateOrganizationSchema } from '../../src/core/validation/portal-organization';
import { CreateActivitySchema } from '../../src/core/validation/portal-activity';
it('rejects reserved public URLs and unknown timezones before persistence', () => {
  expect(
    CreateOrganizationSchema.safeParse({
      name: 'Club',
      slug: 'admin',
      kind: 'CLUB',
      timezone: 'Europe/Brussels',
    }).success,
  ).toBe(false);
  expect(
    CreateOrganizationSchema.safeParse({
      name: 'Club',
      slug: 'club-local',
      kind: 'CLUB',
      timezone: 'Unknown/Zone',
    }).success,
  ).toBe(false);
  expect(
    CreateOrganizationSchema.safeParse({
      name: 'Club',
      slug: 'club-local',
      kind: 'CLUB',
      timezone: 'Europe/Brussels',
    }).success,
  ).toBe(true);
});
it('rejects a recurrent activity with a reversed local time range', () => {
  expect(
    CreateActivitySchema.safeParse({
      organizationId: crypto.randomUUID(),
      name: 'Atelier',
      priceCents: 2000,
      audiencePolicy: 'ALL_PUBLIC',
      paymentMode: 'NONE',
      requirePhone: false,
      bookingWindowWeeks: 4,
      noticeHoursForVoucher: 72,
      voucherValidityMonths: 3,
      schedule: {
        kind: 'WEEKLY',
        slots: [{ dayOfWeek: 3, startTimeLocal: '16:00', endTimeLocal: '14:00', capacity: 5 }],
      },
    }).success,
  ).toBe(false);
});
