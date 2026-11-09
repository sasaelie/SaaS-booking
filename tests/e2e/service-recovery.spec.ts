import { expect, test } from '@playwright/test';
import { bankSpace } from './bank-fixtures';
import { closeBrowserDatabase } from './portal-fixtures';
import sharp from 'sharp';
test.afterAll(closeBrowserDatabase);
test('explains missing and altered self-service links instead of displaying a blank form', async ({
  page,
}) => {
  await page.goto('/manage');
  await expect(page.locator('main').getByRole('alert')).toContainText('invalide ou expiré');
  const space = await bankSpace();
  await page.goto(`/manage#token=${space.token}`);
  await expect(page.getByRole('button', { name: 'Envoyer le justificatif' })).toBeVisible();
  await page.evaluate(() => {
    location.hash = 'token=altered';
  });
  await expect(page.locator('main').getByRole('alert')).toContainText('invalide ou expiré');
  await expect(page.getByRole('button', { name: 'Envoyer le justificatif' })).toHaveCount(0);
});
test('allows an unpaid participant to cancel and refreshes the visible reservation status', async ({
  page,
}) => {
  const space = await bankSpace();
  await page.goto(`/manage#token=${space.token}`);
  await page.getByText('Annuler cette réservation', { exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Annuler ma réservation', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Votre réservation a été annulée.');
  await expect(page.locator('.manage-summary')).toContainText('Annulée');
  await page.reload();
  await expect(page.locator('.manage-summary')).toContainText('Annulée');
  await expect(page.getByRole('button', { name: 'Envoyer le justificatif' })).toHaveCount(0);
});
test('explains a non-JSON upload rejection and lets the participant retry the real upload', async ({
  page,
}) => {
  const space = await bankSpace();
  await page.goto(`/manage#token=${space.token}`);
  const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } })
    .png()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: bytes });
  await page.route(
    '**/api/bank-proof',
    (route) => route.fulfill({ status: 413, contentType: 'text/plain', body: 'Payload Too Large' }),
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Envoyer le justificatif' }).click();
  await expect(page.getByRole('status')).toContainText('Choisissez une image');
  await expect(page.getByRole('button', { name: 'Envoyer le justificatif' })).toBeEnabled();
  await page.getByRole('button', { name: 'Envoyer le justificatif' }).click();
  await expect(page.getByRole('status')).toContainText('Votre justificatif a été reçu');
});

test('distinguishes a temporary context network failure from an invalid link and offers retry', async ({
  page,
}) => {
  const space = await bankSpace();
  await page.route('**/api/self-service/context', (route) => route.abort(), { times: 1 });
  await page.goto(`/manage#token=${space.token}`);
  await expect(page.locator('main').getByRole('alert')).toContainText('Impossible de charger');
  await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Envoyer le justificatif' })).toBeVisible();
});

test('rejects a renamed PDF through the real upload endpoint without changing the reservation', async ({
  page,
}) => {
  const space = await bankSpace();
  await page.goto(`/manage#token=${space.token}`);
  await page.locator('input[type=file]').setInputFiles({
    name: 'renamed.png',
    mimeType: 'image/png',
    buffer: Buffer.from('%PDF-1.4 this is not an image'),
  });
  await page.getByRole('button', { name: 'Envoyer le justificatif' }).click();
  await expect(page.getByRole('status')).toContainText('Choisissez une image');
  const response = await page.request.post('/api/self-service/context', {
    data: { token: space.token },
  });
  expect((await response.json()).data.status).toBe('PENDING_PAYMENT');
});

test('refuses unauthenticated execution of scheduled tasks', async ({ page }) => {
  const response = await page.request.post('/api/jobs');
  expect([401, 503]).toContain(response.status());
});
