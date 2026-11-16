import { expect, test, type Page } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { localDay } from '../../src/app/_ui/calendar-dates';
import { shiftDay } from '../../src/app/_planning/planning-dates';
import { localDayAndTimeToUtc } from '../../src/core/domain/timezone';
import { activityTone } from '../../src/app/_planning/planning-sessions';
test.afterAll(closeBrowserDatabase);
test('uses real sessions, keeps their identity as lights switch off and moves the current-day glow at midnight', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.clock.install({ time: new Date(space.date.getTime() - 60_000) });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const calendar = page.locator('.session-planning');
  const event = calendar.locator('.planning-event');
  await expect(event).toHaveCount(1);
  await expect(event).toHaveAttribute('data-tone', activityTone(space.activityId));
  const today = localDay(space.date.toISOString(), 'Europe/Brussels');
  await expectCurrentDay(page, today);
  await event.evaluate((e) => {
    e.setAttribute('data-preserved', 'yes');
  });
  await page.clock.fastForward(121 * 60_000);
  await expect(event).toHaveAttribute('data-phase', 'past');
  await expect(event).toBeDisabled();
  await expect(event).toHaveAttribute('data-preserved', 'yes');
  await page.clock.runFor(900);
  await expect
    .poll(() =>
      event.locator('.planning-event-light').evaluate((e) => getComputedStyle(e).boxShadow),
    )
    .toBe('none');
  await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toBeDisabled();
  await passMidnight(page, space.date);
  const tomorrow = shiftDay(today, 1);
  if (await calendar.locator(`[data-day="${tomorrow}"]`).count())
    await expectCurrentDay(page, tomorrow);
  else await expect(calendar.locator('.planning-days [aria-current="date"]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('participant-day-lights.png'), fullPage: true });
});
test('opens actual organizer session management and uses the same glass on narrow and wide layouts', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  const calendar = page.locator('.session-planning');
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(calendar.locator('.planning-event')).toHaveCount(1);
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: info.outputPath(`organizer-calendar-${width}.png`),
      fullPage: true,
    });
  }
  await calendar.locator('.portal-session-link').click();
  await expect(page).toHaveURL(/\/seances\//);
  await expect(page.locator('.portal-session-details')).toBeVisible();
});

async function passMidnight(page: Page, date: Date) {
  const tomorrow = new Date(
    `${shiftDay(localDay(date.toISOString(), 'Europe/Brussels'), 1)}T12:00:00Z`,
  );
  const midnight = localTime(tomorrow, '00:00');
  await page.clock.setSystemTime(new Date(midnight.getTime() - 1000));
  await page.clock.fastForward(31_000);
}

async function expectCurrentDay(page: Page, today: string) {
  const button = page.locator('.planning-days [aria-current="date"]');
  await expect(button).toHaveAttribute('data-day', today);
  expect(await button.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe('none');
}

test('shows the continuation of an overnight Sunday session in the following week', async ({
  page,
}) => {
  const space = await browserSpace();
  const sunday = new Date(space.date);
  sunday.setUTCDate(sunday.getUTCDate() + ((7 - sunday.getUTCDay()) % 7));
  const startsAt = localTime(sunday, '23:30');
  const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
  await browserDatabase().query(
    'UPDATE sessions SET starts_at=$1,ends_at=$2 WHERE activity_id=$3',
    [startsAt, endsAt, space.activityId],
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const event = page.locator('.planning-event');
  await expect(event).toHaveCount(1);
  await page.getByRole('button', { name: 'Semaine suivante', exact: true }).click();
  await expect(event).toHaveCount(1);
  await expect(event).toContainText('23:30 – 01:00');
  await expect(event).toHaveCSS('--event-top', '0');
  await event.click();
  await expect(page.locator('input[name="startsAtIso"]')).toHaveValue(startsAt.toISOString());
  await noHorizontalOverflow(page);
});

function localTime(date: Date, time: string): Date {
  const result = localDayAndTimeToUtc(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    time,
    'Europe/Brussels',
  );
  if (!result.ok) throw Error('Valid test date required');
  return result.value;
}
