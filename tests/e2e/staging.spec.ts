import { expect, test } from '@playwright/test';
import { browserSpace, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';

test.skip(process.env['STAGING_BROWSER_TEST'] !== 'true', 'Requires the staging build and server');
test.afterAll(async () => {
  await closeBrowserDatabase();
});

test('labels staging and hides payment connections and paid subscriptions', async ({ page }) => {
  const space = await browserSpace();
  await login(page, space);
  await expect(page.getByRole('note')).toContainText('aucun paiement réel');
  await page.goto(`/app/${space.organizationId}/parametres`);
  await expect(
    page.getByText(/Les connexions Stripe et Mollie seront configurées plus tard/),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connecter Stripe', exact: true })).toHaveCount(0);
  await page.goto(`/app/${space.organizationId}/abonnement`);
  await expect(page.getByText(/Aucun abonnement ne sera facturé/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Activer mon abonnement', exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  await noHorizontalOverflow(page);
});
