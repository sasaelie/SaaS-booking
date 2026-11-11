import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, login } from './portal-fixtures';
import { captureActions } from './action-audit-fixtures';
test.afterAll(closeBrowserDatabase);
test('follows every organizer menu destination and mobile return through actual links', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/app/${space.organizationId}`);
    for (const [label, suffix] of [
      ['Activités', '/activites'],
      ['Réservations', '/reservations'],
      ['Partager', '/partager'],
      ['Apparence', '/parametres'],
      ['Réglages', '/reglages'],
      ['Ma formule', '/abonnement'],
      ['Vue d’ensemble', ''],
    ]) {
      if (width === 390) await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await page.locator('.portal-nav').getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/app/${space.organizationId}${suffix}$`));
      await expect(page.locator('main h1')).toBeVisible();
      await captureActions(page, info, `${width}-${label}`);
      if (width === 390 && suffix) {
        await page
          .locator('.portal-mobile-bar')
          .getByRole('link', { name: /Retour/ })
          .click();
        await expect(page).toHaveURL(new RegExp(`/app/${space.organizationId}$`));
      }
    }
  }
});
test('signs out, invalidates the real application session and follows account entry links', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/connexion$/);
  await page.getByRole('link', { name: 'Mot de passe oublié ?', exact: true }).click();
  await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
  await page.locator('a[href="/connexion"]').click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.locator('a[href="/inscription"]').click();
  await expect(page).toHaveURL(/\/inscription$/);
  await page.getByRole('link', { name: /Retour à l’accueil/ }).click();
  await expect(page).toHaveURL(/\/$/);
});
test('copies the actual booking link and downloads PDF, PNG and accounting files by clicking', async ({
  page,
  context,
}) => {
  const space = await browserSpace();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await page.getByRole('button', { name: 'Copier', exact: true }).first().click();
  await expect(page.getByRole('status')).toContainText(/copié/i);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    new URL(page.url()).origin + '/' + space.slug,
  );
  const pdfPromise = page.waitForEvent('download');
  await page.locator('a[href*="format=pdf"]').click();
  const pdf = await pdfPromise;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  expect(await pdf.failure()).toBeNull();
  await page.getByText('Initiation à la céramique', { exact: true }).click();
  const pngPromise = page.waitForEvent('download');
  await page.locator(`a[href*="activityId=${space.activityId}"]`).click();
  expect((await pngPromise).suggestedFilename()).toMatch(/\.png$/);
  await page.goto(`/app/${space.organizationId}/abonnement`);
  const csvPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Télécharger l’export comptable', exact: true }).click();
  expect((await csvPromise).suggestedFilename()).toMatch(/\.csv$/);
});
