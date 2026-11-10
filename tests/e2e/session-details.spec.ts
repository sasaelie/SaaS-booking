import { expect, test, type Page } from '@playwright/test';
import {
  login,
  browserDatabase,
  closeBrowserDatabase,
  noHorizontalOverflow,
} from './portal-fixtures';
import {
  twoSessionSpace,
  emptyWeeklySpace,
  paginatedSessionSpace,
} from './session-design-fixtures';
import { SAAS } from '../../src/config/constants';
test.afterAll(closeBrowserDatabase);
test('opens a session from the dashboard, keeps only its attendees and returns without getting lost', async ({
  page,
}, info) => {
  const space = await twoSessionSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  await page.locator('.portal-session-link').first().click();
  await expect(page).toHaveURL(/\/seances\//);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Initiation à la céramique');
  await expect(page.getByText('Rue du Test 12', { exact: true })).toBeVisible();
  await expect(page.getByText('Alex Test', { exact: true })).toBeVisible();
  await expect(page.getByText('Other Session', { exact: true })).toHaveCount(0);
  await page.locator('.portal-booking-card > summary').click();
  await expect(page.getByRole('link', { name: 'alex@example.com' })).toBeVisible();
  await glowing(page, '.portal-booking-card .status-badge', 'orange');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`session-${width}.png`), fullPage: true });
  }
  await page.getByRole('link', { name: 'Retour au tableau de bord' }).click();
  await expect(page).toHaveURL(`/app/${space.organizationId}`);
});
test('reads and cancels a generated empty session before any reservation creates its database id', async ({
  page,
}) => {
  const space = await emptyWeeklySpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  await page.locator('.portal-session-link').first().click();
  await expect(page.getByText('Aucun inscrit pour cette séance.', { exact: true })).toBeVisible();
  expect(
    (
      await browserDatabase().query('SELECT id FROM sessions WHERE activity_id=$1', [
        space.activityId,
      ])
    ).rows,
  ).toHaveLength(0);
  await cancelSession(page, 'Atelier exceptionnellement fermé');
  await expect(page.getByText('Séance annulée', { exact: true })).toBeVisible();
  await glowing(page, '.portal-session-heading .status-badge', 'red');
});
test('attempts attendee cancellation emails automatically after confirmation with the exact reason retained', async ({
  page,
}) => {
  const space = await twoSessionSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  await page.locator('.portal-session-link').first().click();
  const reason = 'Professeur indisponible, séance annulée.';
  await cancelSession(page, reason, true);
  await expect(page.getByText('Séance annulée', { exact: true })).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await browserDatabase().query(
            'SELECT attempts FROM outbox_jobs WHERE deduplication_key=$1',
            [`cancellation:${space.bookingId}`],
          )
        ).rows[0]?.attempts,
    )
    .toBe(1);
  const jobs = await browserDatabase().query(
    'SELECT payload FROM outbox_jobs WHERE deduplication_key=$1',
    [`cancellation:${space.bookingId}`],
  );
  expect(jobs.rows[0]?.payload.reason).toBe(reason);
  await expect(page.getByText('Other Session', { exact: true })).toHaveCount(0);
});
async function cancelSession(page: Page, reason: string, confirm = false) {
  await page
    .locator('.portal-session-details > details')
    .filter({ has: page.getByText('Annuler cette séance', { exact: true }) })
    .locator('summary')
    .click();
  await page.getByLabel('Motif', { exact: true }).fill(reason);
  await page.getByRole('button', { name: 'Annuler cette séance', exact: true }).click();
  if (confirm) {
    await page.getByLabel('Je confirme cette opération.', { exact: true }).check();
    await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
  }
}
async function glowing(page: Page, selector: string, tone: string) {
  const dot = page.locator(selector);
  await expect(dot).toHaveAttribute('data-tone', tone);
  expect(await dot.evaluate((element) => getComputedStyle(element, '::before').boxShadow)).not.toBe(
    'none',
  );
}

test('retains the session and route ownership when following attendee pagination links', async ({
  page,
}) => {
  const space = await paginatedSessionSpace();
  await login(page, space);
  const url = `/app/${space.organizationId}/seances/${space.activityId}?startsAt=${encodeURIComponent(space.date.toISOString())}`;
  await page.goto(url);
  await expect(page.locator('.portal-booking-card')).toHaveCount(SAAS.PAGE_SIZE);
  await page.getByRole('link', { name: 'Suivant', exact: true }).click();
  await expect(page.locator('.portal-booking-card')).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get('startsAt')).toBe(space.date.toISOString());
  await page.goto(
    `${page.url()}&organizationId=${crypto.randomUUID()}&activityId=${crypto.randomUUID()}`,
  );
  await expect(page.locator('main h1')).toHaveText('Initiation à la céramique');
  await expect(page.locator('.portal-booking-card')).toHaveCount(1);
});
