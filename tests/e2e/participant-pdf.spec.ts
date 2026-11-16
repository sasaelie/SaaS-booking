import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { browserSpace, login, closeBrowserDatabase } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
async function confirm(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Élodie');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Téléchargement');
  await page
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill(`pdf-${crypto.randomUUID()}@example.invalid`);
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(page.locator('.inline-booking-proof .ticket-qr')).toBeVisible();
}
async function checkDownload(page: Page, filename: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le billet PDF', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(filename);
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  if (!path) throw Error('Downloaded PDF missing');
  const data = await readFile(path);
  expect(data.subarray(0, 5).toString()).toBe('%PDF-');
  expect((await PDFDocument.load(data)).getPageCount()).toBe(1);
  await expect(page.getByRole('link', { name: 'Télécharger le PDF', exact: true })).toHaveAttribute(
    'download',
    filename,
  );
  const retry = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Télécharger le PDF', exact: true }).click();
  expect(await (await retry).failure()).toBeNull();
}
test('downloads a real simulation PDF on mobile without calling browser printing', async ({
  page,
}) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.print = () => {
      throw Error('Printing unavailable');
    };
  });
  await login(page, space);
  await confirm(page, `/simulation/${space.organizationId}/activite/${space.activityId}`);
  await checkDownload(page, 'billet-reservation-test.pdf');
});
test('downloads from the private participant page and allows retry after a temporary font failure', async ({
  page,
}) => {
  const space = await browserSpace();
  await confirm(page, `/${space.slug}/${space.activityId}`);
  const code = await page.locator('.inline-booking-proof textarea').inputValue();
  await page.goto(`/manage#code=${encodeURIComponent(code)}`);
  await expect(page.locator('.ticket-qr')).toBeVisible();
  await page.route('**/fonts/DejaVuSans.ttf', (route) => route.fulfill({ status: 503 }));
  await page.getByRole('button', { name: 'Télécharger le billet PDF', exact: true }).click();
  await expect(
    page.getByText('Impossible de préparer le PDF. Réessayez.', { exact: true }),
  ).toBeVisible();
  await page.unroute('**/fonts/DejaVuSans.ttf');
  await checkDownload(page, 'billet-reservation.pdf');
});
