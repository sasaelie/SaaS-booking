import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, login, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('returns activity details and creation to the activity list at four widths and preserves browser history', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const suffix of [space.activityId, 'nouvelle']) {
      const path = `/app/${space.organizationId}/activites/${suffix}`;
      await page.goto(path);
      const back = page.getByRole('link', { name: 'Retour aux activités', exact: true });
      await expect(back).toBeVisible();
      await expect(back).toHaveAttribute('href', `/app/${space.organizationId}/activites`);
      await back.click();
      await expect(page).toHaveURL(`/app/${space.organizationId}/activites`);
      await page.goBack();
      await expect(page).toHaveURL(path);
      await noHorizontalOverflow(page);
    }
  }
});
test('uses explicit parent destinations without a self-referencing back link', async ({ page }) => {
  const space = await browserSpace();
  await login(page, space);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, label, href] of [
      ['/app', 'Retour à l’accueil', '/'],
      ['/app/nouveau', 'Retour à mes espaces', '/app'],
      [`/app/${space.organizationId}`, 'Retour à mes espaces', '/app'],
      [
        `/app/${space.organizationId}/reglages`,
        'Retour au tableau de bord',
        `/app/${space.organizationId}`,
      ],
    ] as const) {
      await page.goto(path);
      const back = page.getByRole('link', { name: label, exact: true });
      await expect(back).toHaveCount(1);
      await expect(back).toHaveAttribute('href', href);
      await back.click();
      if (path === '/app')
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Me déconnecter', exact: true })
          .click();
      await expect(page).toHaveURL(href);
      if (path === '/app') await login(page, space);
    }
  }
});
test('closes the mobile menu with Escape, restores focus and closes after keyboard navigation', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`/app/${space.organizationId}/activites`);
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  const settings = page.locator('.portal-nav').getByRole('link', { name: 'Réglages', exact: true });
  await settings.focus();
  await settings.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await expect(settings).toBeHidden();
  await menu.press('Space');
  await settings.focus();
  await settings.press('Enter');
  await expect(page).toHaveURL(`/app/${space.organizationId}/reglages`);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(settings).toBeHidden();
});
test('keeps one mobile return on administration home and returns subpages to administration', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/plateforme');
  await expect(page.getByRole('link', { name: 'Retour à mes espaces', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Retour à mon espace organisateur', exact: true }),
  ).toBeHidden();
  await page.goto('/plateforme/operations');
  await page.getByRole('link', { name: 'Retour à l’administration', exact: true }).click();
  await expect(page).toHaveURL('/plateforme');
  await page.getByRole('link', { name: 'Retour à mes espaces', exact: true }).click();
  await expect(page).toHaveURL('/app');
});
