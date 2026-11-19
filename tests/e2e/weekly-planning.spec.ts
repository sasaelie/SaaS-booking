import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { localDay } from '../../src/app/_ui/calendar-dates';
import { shiftDay, weekStart } from '../../src/app/_planning/planning-dates';
test.afterAll(closeBrowserDatabase);
async function weeklySpace() {
  const space = await browserSpace();
  const start = weekStart(localDay(space.date.toISOString(), 'Europe/Brussels'));
  space.date = new Date(`${shiftDay(start, 2)}T13:00:00Z`);
  await browserDatabase().query(
    'UPDATE sessions SET starts_at=$1,ends_at=$2 WHERE activity_id=$3',
    [space.date, new Date(space.date.getTime() + 7200000), space.activityId],
  );
  for (const date of [
    new Date(space.date.getTime() + 3 * 3600000),
    new Date(space.date.getTime() + 6 * 3600000),
    new Date(`${shiftDay(start, 5)}T09:00:00Z`),
    new Date(`${shiftDay(start, 6)}T13:00:00Z`),
  ]) {
    await browserDatabase().query(
      'INSERT INTO sessions(organization_id,activity_id,starts_at,ends_at,capacity,is_manual) VALUES($1,$2,$3,$4,8,true)',
      [space.organizationId, space.activityId, date, new Date(date.getTime() + 7200000)],
    );
  }
  return { ...space, start, saturday: shiftDay(start, 5), sunday: shiftDay(start, 6) };
}
test('shows all seven days by default on mobile and opens weekend sessions with their actual remaining seats', async ({
  page,
}, info) => {
  const space = await weeklySpace();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const calendar = page.locator('.session-planning');
  await expect(calendar.getByRole('combobox')).toHaveValue('week');
  await expect(calendar.locator('.planning-week-day')).toHaveCount(7);
  await expect(calendar.locator(`.planning-week-day[data-day="${space.saturday}"]`)).toContainText(
    '8 / 8 places',
  );
  await expect(calendar.locator('.planning-week-more')).toHaveText('+1 séance');
  for (const width of [320, 390, 730]) {
    await page.setViewportSize({ width, height: 1100 });
    await noHorizontalOverflow(page);
    await calendar.screenshot({ path: info.outputPath(`week-participant-${width}.png`) });
  }
  const sunday = calendar.locator(`.planning-week-day[data-day="${space.sunday}"]`);
  await sunday.focus();
  await sunday.press('Enter');
  await expect(calendar).toHaveAttribute('data-view', 'day');
  await expect(calendar.locator('.planning-day-heading[data-selected="true"]')).toBeFocused();
  await expect(calendar.locator('.planning-event')).toHaveCount(1);
  await expect(page.locator('input[name="startsAtIso"]')).toHaveValue('');
  await calendar.locator('.planning-event').click();
  await expect(page.locator('input[name="startsAtIso"]')).toHaveValue(
    `${space.sunday}T13:00:00.000Z`,
  );
  await calendar.screenshot({ path: info.outputPath('weekend-day.png') });
});
test('opens empty days without keeping a hidden session selected and retains the month option', async ({
  page,
}) => {
  const space = await weeklySpace();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const calendar = page.locator('.session-planning');
  await calendar.locator('.planning-week-day[aria-label*=", 0 séances,"]').first().click();
  await expect(calendar.locator('.planning-event')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toBeDisabled();
  await calendar.getByRole('combobox').selectOption('month');
  await expect(calendar.locator('.planning-month')).toBeVisible();
  await calendar.getByRole('combobox').selectOption('week');
  await expect(calendar.locator('.planning-week-day')).toHaveCount(7);
});
test('uses the same weekly overview for organizers and keeps desktop time columns clickable', async ({
  page,
}, info) => {
  const space = await weeklySpace();
  await page.setViewportSize({ width: 390, height: 1000 });
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  const calendar = page.locator('.session-planning');
  await expect(calendar.locator('.planning-week-day')).toHaveCount(7);
  await calendar.screenshot({ path: info.outputPath('week-organizer-mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(calendar.locator('.planning-day')).toHaveCount(7);
  await noHorizontalOverflow(page);
  await calendar.screenshot({ path: info.outputPath('week-organizer-desktop.png') });
  await calendar.getByRole('button', { name: /Voir la journée,.*samedi/ }).click();
  await expect(calendar.locator('.portal-session-link')).toHaveCount(1);
  await calendar.locator('.portal-session-link').click();
  await expect(page).toHaveURL(/\/seances\//);
  await expect(page.locator('.portal-session-details')).toBeVisible();
});
test('retains the current-day glow and switches off only elapsed session indicators in the week', async ({
  page,
}) => {
  const space = await weeklySpace();
  await page.clock.install({ time: new Date(space.date.getTime() + 121 * 60000) });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const calendar = page.locator('.session-planning');
  const today = calendar.locator('.planning-week-day[aria-current="date"]');
  await expect(today).toHaveAttribute(
    'data-day',
    localDay(space.date.toISOString(), 'Europe/Brussels'),
  );
  await expect(today.locator('.planning-week-session[data-phase="past"] i')).toHaveCSS(
    'box-shadow',
    'none',
  );
  expect(
    await today
      .locator('.planning-week-session[data-phase="future"] i')
      .evaluate((e) => getComputedStyle(e).boxShadow),
  ).not.toBe('none');
  expect(
    await today
      .locator('.planning-week-date strong')
      .evaluate((e) => getComputedStyle(e).boxShadow),
  ).not.toBe('none');
});
