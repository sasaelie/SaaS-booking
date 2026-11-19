import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { WEBSITE_PREVIEW as W, websitePreviewPath } from '../../src/config/website-preview';
import {
  browserUser,
  browserDatabase,
  login,
  closeBrowserDatabase,
  noHorizontalOverflow,
} from './portal-fixtures';
import {
  privatePreviewSpace,
  assertOnlyTestBooking,
  choosePrivatePreviewCourse,
  capturePrivatePreview,
  assertPrivateFrameDenied,
  assertNoPreviewCopy,
} from './private-site-preview-fixtures';
import { completeEmbeddedBooking, assertEmbedFits, saveEmbeddedTicket } from './embed-fixtures';
test.afterAll(closeBrowserDatabase);
test('shows the real website appearance and completes an isolated TEST booking and ticket download on mobile', async ({
  page,
}, info) => {
  const space = await privatePreviewSpace();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 1000 });
  await login(page, space);
  const response = await page.goto(W.PATH);
  expect(response?.headers()['cache-control']).toContain('no-store');
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  const embedded = await page.request.get(websitePreviewPath(W.SLUG));
  expect(embedded.headers()['x-frame-options']).toBe('SAMEORIGIN');
  expect(embedded.headers()['content-security-policy']).toContain("frame-ancestors 'self'");
  expect(embedded.headers()['cache-control']).toContain('no-store');
  await expect(page.getByText(W.NOTE, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Studio Créatif 360 — accueil' }).first(),
  ).toBeVisible();
  await expect(
    page.frameLocator('iframe').getByText('Couture débutant', { exact: true }),
  ).toBeVisible();
  await assertEmbedFits(page);
  await capturePrivatePreview(page, info, 'private-site-catalog-mobile');
  await choosePrivatePreviewCourse(page);
  await capturePrivatePreview(page, info, 'private-site-calendar-mobile');
  await completeEmbeddedBooking(page);
  await expect(page.frameLocator('iframe').locator('.ice-result')).toContainText(
    'Simulation participant — TEST',
  );
  await assertOnlyTestBooking(space.organizationId);
  await saveEmbeddedTicket(page, 'billet-reservation-test.pdf');
  await noHorizontalOverflow(page);
  await capturePrivatePreview(page, info, 'private-site-confirmation-mobile');
  expect(errors).toEqual([]);
});
test('keeps the original website menu working and the entire embedded content within four widths', async ({
  page,
}, info) => {
  const space = await privatePreviewSpace();
  await login(page, space);
  await page.goto(W.PATH);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertEmbedFits(page);
    await noHorizontalOverflow(page);
    await capturePrivatePreview(page, info, `private-site-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'Réserver', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const audit = await new AxeBuilder({ page }).include('main').analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});
test('denies anonymous, non-administrator and other-organization sessions before exposing the private document', async ({
  page,
}) => {
  const space = await privatePreviewSpace();
  await page.goto(W.PATH);
  await expect(page).toHaveURL(/\/connexion$/);
  await assertPrivateFrameDenied(page, websitePreviewPath(W.SLUG));
  const outsider = await browserUser(true);
  await login(page, outsider);
  const denied = await page.request.get(W.PATH, { maxRedirects: 0 });
  expect(denied.status()).not.toBe(200);
  expect((await denied.text()).includes('studio-booking-preview')).toBe(false);
  await assertNoPreviewCopy(space.organizationId);
  await page.context().clearCookies();
  await login(page, space);
  await browserDatabase().query('DELETE FROM platform_operators WHERE user_id=$1', [
    space.actor.id,
  ]);
  expect((await page.request.get(W.PATH, { maxRedirects: 0 })).status()).not.toBe(200);
  await assertPrivateFrameDenied(page, websitePreviewPath(W.SLUG));
});
test('refuses foreign course identifiers and expired administrator verification inside the preview', async ({
  page,
}) => {
  const space = await privatePreviewSpace();
  await login(page, space);
  await assertPrivateFrameDenied(page, websitePreviewPath('another-organization'));
  await assertPrivateFrameDenied(page, websitePreviewPath(W.SLUG, crypto.randomUUID()));
  await browserDatabase().query(
    'INSERT INTO administrator_security(user_id,enabled) VALUES($1,true) ON CONFLICT(user_id) DO UPDATE SET enabled=true',
    [space.actor.id],
  );
  const response = await page.request.get(W.PATH, { maxRedirects: 0 });
  expect(response.headers()['location']).toMatch(/\/compte\/securite$/);
  await assertPrivateFrameDenied(page, websitePreviewPath(W.SLUG));
});
