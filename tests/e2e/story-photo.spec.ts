import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { browserSpace, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('confines the uploaded photo and each text color to the activity presentation', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await uploadPhoto(page, space.organizationId);
  for (const [tone, color] of [
    ['BLACK', 'rgb(17, 17, 17)'],
    ['FOREST', 'rgb(20, 61, 43)'],
    ['WHITE', 'rgb(255, 255, 255)'],
  ] as const) {
    await saveTone(page, tone);
    await checkCatalog(page, space.slug, color);
    await page.goto(`/${space.slug}/${space.activityId}`);
    await expect(page.locator('.ice-story')).toHaveCSS('color', color);
    await expect(page.locator('.ice-brand-scene img')).toHaveCount(0);
    await expect(page.locator('.ice-widget-root')).toHaveCSS('color', 'rgb(20, 61, 43)');
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          page
            .locator('.ice-story-photo')
            .evaluate(
              (img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0,
            ),
        )
        .toBe(true);
      await noHorizontalOverflow(page);
      await page.screenshot({
        path: info.outputPath(`story-${tone}-${width}.png`),
        fullPage: true,
      });
    }
    await page.goto(`/app/${space.organizationId}/parametres`);
  }
});
async function saveTone(page: Page, tone: string) {
  await page.locator(`.story-text-choices label[data-tone="${tone}"]`).click();
  await expect(page.locator('.appearance-story-preview .ice-story')).toHaveAttribute(
    'data-tone',
    tone,
  );
  await page.getByRole('button', { name: 'Enregistrer l’apparence' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Apparence enregistrée.' }),
  ).toBeVisible();
}

async function uploadPhoto(page: Page, organizationId: string) {
  const bytes = await sharp({
    create: { width: 600, height: 400, channels: 3, background: '#e1a270' },
  })
    .png()
    .toBuffer();
  await page.goto(`/app/${organizationId}/parametres`);
  await page.getByText('Logo et photo de présentation', { exact: true }).click();
  const media = page
    .locator('.portal-panel')
    .filter({ has: page.getByRole('heading', { name: 'Photo de l’encart de présentation' }) })
    .last();
  await media
    .locator('input[type=file]')
    .setInputFiles({ name: 'atelier.png', mimeType: 'image/png', buffer: bytes });
  await media.getByRole('button', { name: 'Importer l’image' }).click();
  await expect(page.locator('.appearance-story-preview img')).toBeVisible();
}

async function checkCatalog(page: Page, slug: string, color: string) {
  await page.goto(`/${slug}`);
  const card = page.locator('article.ice-catalog-card');
  await expect(card).toHaveCSS('color', color);
  await expect(card.locator('.portal-muted')).toHaveCSS('color', color);
  await expect
    .poll(() =>
      card
        .locator('img')
        .evaluate((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await noHorizontalOverflow(page);
    await expect(card.getByRole('link', { name: 'Choisir une séance' })).toHaveCSS(
      'color',
      'rgb(20, 61, 43)',
    );
  }
}
