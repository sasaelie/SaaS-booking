import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase } from './portal-fixtures';
import { externalWebsite, completeEmbeddedBooking } from './embed-fixtures';
test.afterAll(async () => {
  await closeBrowserDatabase();
});
test('embeds the real reservation flow on a different origin and resizes without accepting forged messages', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  const site = await externalWebsite(space, 'inline', baseURL);
  try {
    const response = await page.request.get(`${baseURL}/embed/${space.slug}/${space.activityId}`);
    expect(response.headers()['x-frame-options']).toBeUndefined();
    expect(response.headers()['content-security-policy']).toContain('frame-ancestors');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(site.url);
    const frame = page.frameLocator('iframe');
    await expect(frame.getByRole('heading', { level: 1 })).toContainText('céramique');
    await expect(page.locator('iframe')).not.toHaveCSS('height', '1000px');
    await page.evaluate(async () => {
      window.postMessage({ type: 'booking-widget:resize', height: 5555 }, location.origin);
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    await expect(page.locator('iframe')).not.toHaveCSS('height', '5555px');
    await completeEmbeddedBooking(page);
    await expect(
      frame.getByRole('status').filter({ hasText: 'Votre place est réservée.' }),
    ).toBeVisible();
    await page.screenshot({ path: info.outputPath('external-website-mobile.png'), fullPage: true });
  } finally {
    await site.close();
  }
});
test('opens and closes the floating reservation window and blocks framing the organizer console', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  const site = await externalWebsite(space, 'floating', baseURL);
  try {
    await page.goto(site.url);
    await page.getByRole('button', { name: 'Réserver', exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Réserver une activité', exact: true }),
    ).toBeVisible();
    await expect(page.frameLocator('iframe').getByRole('heading', { level: 1 })).toContainText(
      'céramique',
    );
    await page.getByRole('button', { name: 'Fermer la réservation', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect((await page.request.get(`${baseURL}/connexion`)).headers()['x-frame-options']).toBe(
      'DENY',
    );
  } finally {
    await site.close();
  }
});
