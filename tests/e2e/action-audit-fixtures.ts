import { drizzle } from 'drizzle-orm/node-postgres';
import type { Page, TestInfo } from '@playwright/test';
import { browserDatabase, type browserSpace } from './portal-fixtures';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
export async function addAuditActivity(
  space: Awaited<ReturnType<typeof browserSpace>>,
  name: string,
) {
  return required(
    await new DrizzlePortalRepository(drizzle(browserDatabase())).createActivity(space.actor, {
      organizationId: space.organizationId,
      name,
      description: '',
      priceCents: 0,
      audiencePolicy: 'ALL_PUBLIC',
      paymentMode: 'NONE',
      requirePhone: false,
      bookingWindowWeeks: 4,
      noticeHoursForVoucher: 72,
      voucherValidityMonths: 2,
      schedule: {
        kind: 'WEEKLY',
        slots: [
          {
            dayOfWeek: space.date.getUTCDay(),
            startTimeLocal: '14:00',
            endTimeLocal: '16:00',
            capacity: 8,
          },
        ],
      },
    }),
  );
}
export async function captureActions(page: Page, info: TestInfo, name: string) {
  const controls = await page.locator('a,button,summary').evaluateAll((elements) =>
    elements
      .filter((e) => e.getClientRects().length)
      .map((e) => ({
        tag: e.tagName,
        text: (e.textContent ?? '').trim(),
        label: e.getAttribute('aria-label'),
        disabled: e.matches(':disabled'),
        href: e.getAttribute('href')?.split('#')[0],
      })),
  );
  await info.attach(name, {
    body: JSON.stringify(controls, null, 2),
    contentType: 'application/json',
  });
}
