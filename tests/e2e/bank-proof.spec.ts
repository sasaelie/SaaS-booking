import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { bankSpace } from './bank-fixtures';
import { closeBrowserDatabase, login, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('participant uploads proof and organizer reads and approves it from the attendee card', async ({
  page,
}, info) => {
  const space = await bankSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/manage#token=${encodeURIComponent(space.token)}`);
  await expect(page.getByRole('link', { name: 'Retour à l’activité' })).toHaveAttribute(
    'href',
    `/${space.slug}/${space.activityId}`,
  );
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: 'white' } })
    .png()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'virement.png', mimeType: 'image/png', buffer: bytes });
  await page.getByRole('button', { name: 'Envoyer le justificatif' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Votre justificatif a été reçu' }),
  ).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('participant-proof-mobile.png'), fullPage: true });
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations?activityId=${space.activityId}`);
  await page.locator('summary').filter({ hasText: 'Alex Test' }).click();
  await expect(page.getByText('alex@example.com', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Consulter le justificatif' }).click();
  const link = page.getByRole('link', { name: /Ouvrir le justificatif/ });
  await expect(link).toBeVisible();
  const url = await link.getAttribute('href');
  if (!url) throw Error('Missing private URL');
  expect((await page.request.get(url)).status()).toBe(200);
  await verifySeparatedDecisions(page);
  await page.screenshot({ path: info.outputPath('organizer-attendee-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Confirmer le virement', exact: true }).click();
  await expect(page.locator('summary').getByText('Confirmée', { exact: true })).toBeVisible();
  expect((await page.request.get(url)).status()).toBe(404);
});

async function verifySeparatedDecisions(page: Page) {
  const approve = await page
    .getByRole('button', { name: 'Confirmer le virement', exact: true })
    .boundingBox();
  const reject = await page
    .getByRole('button', { name: 'Refuser le virement', exact: true })
    .boundingBox();
  expect(approve).not.toBeNull();
  expect(reject).not.toBeNull();
  expect((reject?.y ?? 0) - ((approve?.y ?? 0) + (approve?.height ?? 0))).toBeGreaterThanOrEqual(
    12,
  );
}
