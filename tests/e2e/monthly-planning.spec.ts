import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { localDay, monthLabel, monthOf, shiftMonth } from '../../src/app/_ui/calendar-dates';
test.afterAll(closeBrowserDatabase);
async function monthlySpace() {
  const space = await browserSpace();
  const nextMonth = new Date(space.date);
  nextMonth.setUTCDate(1);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  for (const date of [new Date(space.date.getTime() + 3 * 3600000), nextMonth]) {
    await browserDatabase().query(
      'INSERT INTO sessions(organization_id,activity_id,starts_at,ends_at,capacity,is_manual) VALUES($1,$2,$3,$4,8,true)',
      [space.organizationId, space.activityId, date, new Date(date.getTime() + 7200000)],
    );
  }
  return space;
}
test('browses real months on mobile and opens the exact day before choosing a session, with keyboard focus retained', async ({
  page,
}, info) => {
  const space = await monthlySpace();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  await page
    .getByRole('combobox', { name: 'Affichage du planning', exact: true })
    .selectOption('month');
  const calendar = page.locator('.session-planning');
  const day = localDay(space.date.toISOString(), 'Europe/Brussels');
  const cell = calendar.locator(`.planning-month-day[data-day="${day}"]`);
  await expect(cell).toHaveAttribute('aria-label', /2 séances/);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await noHorizontalOverflow(page);
    expect(
      await calendar
        .locator('.planning-month-day')
        .first()
        .evaluate((e) => e.getBoundingClientRect().width),
    ).toBeGreaterThanOrEqual(24);
    await calendar.screenshot({ path: info.outputPath(`month-participant-${width}.png`) });
  }
  await page.getByRole('button', { name: 'Mois suivant', exact: true }).click();
  await expect(calendar.locator('.planning-period')).toContainText(
    monthLabel(shiftMonth(monthOf(day), 1)),
  );
  await expect(page.getByRole('button', { name: 'Mois suivant', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Mois précédent', exact: true }).click();
  await cell.focus();
  await cell.press('Enter');
  await expect(calendar).toHaveAttribute('data-view', 'day');
  await expect(calendar.locator('.planning-day-heading[data-selected="true"]')).toBeFocused();
  await expect(calendar.locator('.planning-event')).toHaveCount(2);
  await calendar.locator('.planning-event').last().click();
  await expect(page.locator('input[name="startsAtIso"]')).toHaveValue(
    new Date(space.date.getTime() + 3 * 3600000).toISOString(),
  );
});
test('keeps all three desktop views available and opens actual organizer session management from a month day', async ({
  page,
}, info) => {
  const space = await monthlySpace();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  const calendar = page.locator('.session-planning');
  await page.getByRole('button', { name: 'Mois', exact: true }).click();
  await expect(calendar.locator('.planning-month')).toBeVisible();
  await noHorizontalOverflow(page);
  await calendar.screenshot({ path: info.outputPath('month-organizer-desktop.png') });
  await page.getByRole('button', { name: 'Semaine', exact: true }).click();
  await expect(calendar).toHaveAttribute('data-day-view', 'false');
  await page.getByRole('button', { name: 'Journée', exact: true }).click();
  await expect(calendar).toHaveAttribute('data-day-view', 'true');
  await page.getByRole('button', { name: 'Mois', exact: true }).click();
  const day = localDay(space.date.toISOString(), 'Europe/Brussels');
  await calendar.locator(`.planning-month-day[data-day="${day}"]`).click();
  await calendar.locator('.portal-session-link').first().click();
  await expect(page).toHaveURL(/\/seances\//);
  await expect(page.locator('.portal-session-details')).toBeVisible();
});
test('keeps today independent of browsing and turns only ended monthly event lights off', async ({
  page,
}) => {
  const space = await monthlySpace();
  await page.clock.install({ time: new Date(space.date.getTime() + 121 * 60000) });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  await page
    .getByRole('combobox', { name: 'Affichage du planning', exact: true })
    .selectOption('month');
  const day = localDay(space.date.toISOString(), 'Europe/Brussels');
  const cell = page.locator(`.planning-month-day[data-day="${day}"]`);
  await expect(cell).toHaveAttribute('aria-current', 'date');
  await expect(cell.locator('.planning-month-session[data-phase="past"]')).toHaveCount(1);
  await expect(cell.locator('.planning-month-session[data-phase="future"]')).toHaveCount(1);
  await expect(cell.locator('.planning-month-session[data-phase="past"] i')).toHaveCSS(
    'box-shadow',
    'none',
  );
  expect(
    await cell
      .locator('.planning-month-session[data-phase="future"] i')
      .evaluate((e) => getComputedStyle(e).boxShadow),
  ).not.toBe('none');
  await page.getByRole('button', { name: 'Mois suivant', exact: true }).click();
  await expect(page.locator('.planning-month-day[aria-current="date"]')).toHaveCount(0);
});
test('does not carry an old selected session into a different empty day opened from the month', async ({
  page,
}) => {
  const space = await monthlySpace();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(page.locator('input[name="startsAtIso"]')).not.toHaveValue('');
  await page
    .getByRole('combobox', { name: 'Affichage du planning', exact: true })
    .selectOption('month');
  await page.locator('.planning-month-day[aria-label$="0 séances"]').first().click();
  await expect(page.locator('input[name="startsAtIso"]')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toBeDisabled();
  await expect(page.locator('.planning-event')).toHaveCount(0);
});
