import { expect, test } from '@playwright/test';
import { browserSpace, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('previews and persists separate colors and provides unambiguous mobile navigation', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/parametres`);
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Activités', exact: true })).toBeHidden();
  const slider = page.getByRole('slider', { name: 'Couleur du dégradé' });
  await slider.focus();
  await slider.press('End');
  await slider.press('ArrowLeft');
  await expect(page.locator('.appearance-preview .color-scene')).toHaveAttribute('style', /358/);
  await page.getByRole('button', { name: 'Organisateur', exact: true }).click();
  await slider.focus();
  await slider.press('Home');
  await slider.press('ArrowRight');
  await expect(page.locator('.appearance-preview .color-scene')).toHaveAttribute('style', /1/);
  await page.getByRole('button', { name: 'Enregistrer l’apparence' }).click();
  await expect(page.getByRole('status')).toHaveText('Apparence enregistrée.');
  await expect(page.locator('.portal-root > .color-scene')).toHaveAttribute('style', /1/);
  await page.reload();
  await expect(slider).toHaveValue('358');
  await page.screenshot({ path: info.outputPath('appearance-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Réglages', exact: true })).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('navigation-mobile.png'), fullPage: true });
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(page.locator('.ice-brand-scene .color-scene')).toHaveAttribute('style', /358/);
  await noHorizontalOverflow(page);
});
