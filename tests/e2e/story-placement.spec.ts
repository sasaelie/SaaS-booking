import { expect, test, type Page, type Locator } from '@playwright/test';
import sharp from 'sharp';
import { browserSpace, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('persists precise placement with pointer and keyboard controls and keeps editing discoverable', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/parametres`);
  const title = page.getByRole('button', { name: 'Déplacer le titre', exact: true });
  await title.focus();
  await title.press('ArrowDown');
  await expect(title).toHaveAttribute('style', /17%/);
  const price = page.getByRole('button', { name: 'Déplacer le tarif', exact: true });
  await price.scrollIntoViewIfNeeded();
  const original = await price.getAttribute('style');
  await touchDrag(page, price);
  await expect(price).not.toHaveAttribute('style', original ?? '');
  await page.getByRole('button', { name: 'Enregistrer l’apparence' }).click();
  await expect(page.getByText('Apparence enregistrée.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(title).toHaveAttribute('style', /17%/);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('placement-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'Modifier le nom et le tarif' }).click();
  await expect(page.locator('#activity-edit')).toHaveAttribute('open', '');
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(page.locator('.story-positioned-title')).toHaveAttribute('style', /17%/);
});
test('lights the green diode only after the stored image has decoded and shows accepted formats', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/parametres`);
  await page.locator('.appearance-media > summary').click();
  const panel = page
    .locator('.portal-panel:has(> h3)')
    .filter({ has: page.getByRole('heading', { name: 'Logo de l’organisation', exact: true }) });
  await expect(panel.getByText('PNG, JPEG ou WebP · 4 Mo maximum', { exact: true })).toBeVisible();
  expect(
    await panel
      .locator('.media-format-hint')
      .evaluate((element) => getComputedStyle(element).fontWeight),
  ).toBe('400');
  const image = await sharp({
    create: { width: 64, height: 64, channels: 3, background: '#143d2b' },
  })
    .png()
    .toBuffer();
  await panel
    .locator('input[type=file]')
    .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: image });
  await panel.getByRole('button', { name: 'Importer l’image' }).click();
  await expect(panel.locator('.status-badge[data-tone=green]')).toHaveText(
    'Image enregistrée et chargée',
  );
  const decoded = await panel
    .locator('img')
    .evaluate(
      (element) =>
        element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
    );
  expect(decoded).toBe(true);
  await page.screenshot({ path: info.outputPath('image-chargee.png'), fullPage: true });
});

async function touchDrag(page: Page, handle: Locator) {
  const box = await handle.boundingBox();
  if (!box) throw Error('Handle missing');
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: point.x + 25, y: point.y - 40 }],
  });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}
