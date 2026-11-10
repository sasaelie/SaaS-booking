import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  login,
  closeBrowserDatabase,
  noHorizontalOverflow,
} from './portal-fixtures';
import { releasedCreditSpace } from './journey-audit-fixtures';
test.afterAll(closeBrowserDatabase);
test('reveals an invalid field inside a closed settings section instead of making save look unresponsive', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reglages`);
  const group = page
    .locator('details')
    .filter({ has: page.getByText('Réseaux et contact', { exact: true }) });
  await group.locator('summary').click();
  await page.getByLabel('Instagram', { exact: true }).fill('not-a-url');
  await group.locator('summary').click();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(group).toHaveAttribute('open', '');
  await expect(page.getByLabel('Instagram', { exact: true })).toBeFocused();
  await page.getByLabel('Instagram', { exact: true }).fill('https://instagram.com/test');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistr');
});
test('offers manual credits only for eligible cancellations, not a released unpaid credit', async ({
  page,
}) => {
  const space = await releasedCreditSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations`);
  const card = page.locator('.portal-booking-card').filter({ hasText: 'Robin Credit' });
  await card.locator('summary').click();
  await expect(
    card.getByRole('button', { name: 'Accorder un code de report', exact: true }),
  ).toHaveCount(0);
});
test('explains the activity reached by a direct link and keeps its title above lengthy practical information', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await browserDatabase().query(
    "UPDATE activities SET description=$2,practical_info=$3,address='Rue du Test 12' WHERE id=$1",
    [
      space.activityId,
      'Découvrez la céramique avec un accompagnement individuel.',
      'Consigne détaillée. '.repeat(30),
    ],
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const title = await page.locator('h1').boundingBox(),
    details = await page.locator('.event-information').first().boundingBox();
  await page.screenshot({ path: info.outputPath('participant-hierarchy.png'), fullPage: true });
  expect.soft(title?.y).toBeLessThan(details?.y ?? 0);
  const description = page.getByText('Découvrez la céramique avec un accompagnement individuel.', {
    exact: true,
  });
  if (await page.getByText('À propos de cette activité', { exact: true }).count())
    await page.getByText('À propos de cette activité', { exact: true }).click();
  await expect(description).toBeVisible();
  await page.getByText('Informations pratiques', { exact: true }).click();
  await expect(
    page.getByText('Consigne détaillée. '.repeat(30).trim(), { exact: true }),
  ).toBeVisible();
  await noHorizontalOverflow(page);
});
test('uses explicit activity actions with comfortable mobile targets', async ({ page }, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/app/${space.organizationId}/activites`);
  const link = page.locator(
    `main a[href="/app/${space.organizationId}/activites/${space.activityId}"]`,
  );
  const bounds = await link.boundingBox();
  await page.screenshot({ path: info.outputPath('activity-actions.png'), fullPage: true });
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await noHorizontalOverflow(page);
});
