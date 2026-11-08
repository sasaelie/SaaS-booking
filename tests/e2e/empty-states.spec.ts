import { expect, test } from '@playwright/test';
import { browserUser, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
import { createSpaceInBrowser, grantInBrowser } from './portal-onboarding';

test.afterAll(async () => {
  await closeBrowserDatabase();
});

test('shows one empty-space action and an actionable first-activity state', async ({ page }) => {
  const user = await browserUser(true);
  await login(page, user);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.locator('main header').getByRole('link', { name: 'Créer un espace', exact: true }),
  ).toHaveCount(0);
  const { id, slug } = await createSpaceInBrowser(page);
  if (!id) throw Error('Missing organization');
  const empty = page.locator('.portal-empty');
  const accessLink = empty.getByRole('link');
  await expect(accessLink).toHaveAttribute('href', `/app/${id}/abonnement`);
  await accessLink.click();
  await expect(page).toHaveURL(new RegExp(`/app/${id}/abonnement$`));
  await grantInBrowser(page, slug);
  for (const suffix of ['', '/activites']) {
    await page.goto(`/app/${id}${suffix}`);
    const create = page
      .locator('main')
      .getByRole('link', { name: 'Créer une activité', exact: true });
    await expect(create).toHaveCount(1);
    await expect(create).toBeVisible();
    await noHorizontalOverflow(page);
    await create.click();
    await expect(page.getByRole('button', { name: 'Créer et publier', exact: true })).toBeEnabled();
  }
});
