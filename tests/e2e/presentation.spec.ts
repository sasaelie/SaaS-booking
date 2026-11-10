import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('uses Mes espaces and aligns appearance actions while keeping unsaved changes informational', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await expect(page.locator('main h1')).toHaveText('Mes espaces');
  await page.goto(`/app/${space.organizationId}/parametres`);
  const slider = page.getByRole('slider', { name: 'Couleur du dégradé' });
  await slider.focus();
  await slider.press('End');
  const feedback = page.locator('.appearance-feedback');
  await expect(feedback).toHaveText('Modifications non enregistrées');
  await expect(feedback).toHaveAttribute('data-tone', 'orange');
  expect(await feedback.evaluate((element) => element.tagName)).toBe('P');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await checkFooterAlignment(page, width);
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`appearance-${width}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Enregistrer l’apparence' }).click();
  await expect(feedback).toHaveText('Apparence enregistrée.');
  await expect(feedback).toHaveAttribute('data-tone', 'green');
});
test('highlights long course titles with readable editorial typography and aligned price and booking actions', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await browserDatabase().query('UPDATE activities SET name=$2 WHERE id=$1', [
    space.activityId,
    'Les rencontres des couturières — Initiation et créations partagées',
  ]);
  await login(page, space);
  await uploadPhoto(page, space.organizationId);
  await page.goto(`/${space.slug}`);
  const card = page.locator('.catalog-activity');
  await expect(card.locator('h2')).toHaveCSS('font-family', /Iowan Old Style/);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const title = await card.locator('h2').boundingBox();
    const price = await card.locator('.catalog-price').boundingBox();
    const action = await card.getByRole('link', { name: 'Choisir une séance' }).boundingBox();
    expect(title?.y).toBeLessThan(price?.y ?? 0);
    expect(price?.y).toBeLessThan(action?.y ?? 0);
    expect(Math.abs((title?.x ?? 0) - (action?.x ?? 0))).toBeLessThan(1);
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`catalog-${width}.png`), fullPage: true });
  }
  await card.getByRole('link', { name: 'Choisir une séance' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Les rencontres des couturières',
  );
});
test('shows luminous orange pending activation, green offered access and red expired access to administrators', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await browserDatabase().query(
    "UPDATE organization_access SET complimentary=false,status='INACTIVE',current_period_end=null WHERE organization_id=$1",
    [space.organizationId],
  );
  await page.goto(`/plateforme?search=${space.slug}`);
  await statusLight(page, 'orange');
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=true WHERE organization_id=$1',
    [space.organizationId],
  );
  await page.reload();
  await statusLight(page, 'green');
  await browserDatabase().query(
    "UPDATE organization_access SET complimentary=false,status='CANCELED',current_period_end=now()-interval '1 day' WHERE organization_id=$1",
    [space.organizationId],
  );
  await page.reload();
  await statusLight(page, 'red');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: info.outputPath('status-red-mobile.png'), fullPage: true });
});
async function statusLight(page: Page, tone: string) {
  const badge = page.locator('main .status-badge').first();
  await expect(badge).toHaveAttribute('data-tone', tone);
  expect(
    await badge.evaluate((element) => getComputedStyle(element, '::before').boxShadow),
  ).not.toBe('none');
}
async function checkFooterAlignment(page: Page, width: number) {
  const light = await page
    .getByRole('button', { name: 'Enregistrer l’apparence' })
    .evaluate((element) => {
      const style = getComputedStyle(element, '::after');
      return {
        position: style.position,
        background: style.backgroundColor,
        shadow: style.boxShadow,
      };
    });
  expect(light.position).toBe('static');
  expect(light.background).toBe('rgb(40, 218, 120)');
  expect(light.shadow).not.toBe('none');
  const reset = await page
    .getByRole('button', { name: 'Rétablir les couleurs par défaut' })
    .boundingBox();
  const open = await page.getByRole('link', { name: /Ouvrir ma page participant/ }).boundingBox();
  expect(reset).not.toBeNull();
  expect(open).not.toBeNull();
  if (width > 380) expect(reset?.y).toBe(open?.y);
  else expect(reset?.x).toBe(open?.x);
  expect(reset?.height).toBeGreaterThanOrEqual(44);
  expect(open?.height).toBeGreaterThanOrEqual(44);
}
async function uploadPhoto(page: Page, organizationId: string) {
  await page.goto(`/app/${organizationId}/parametres`);
  await page.getByText('Logo et photo de présentation', { exact: true }).click();
  const media = page
    .locator('.portal-panel')
    .filter({ has: page.getByRole('heading', { name: 'Photo de l’encart de présentation' }) })
    .last();
  const bytes = await sharp({
    create: { width: 600, height: 400, channels: 3, background: '#bd8167' },
  })
    .png()
    .toBuffer();
  await media
    .locator('input[type=file]')
    .setInputFiles({ name: 'atelier.png', mimeType: 'image/png', buffer: bytes });
  await media.getByRole('button', { name: 'Importer l’image' }).click();
  await expect(page.locator('.appearance-story-preview img')).toBeVisible();
}
