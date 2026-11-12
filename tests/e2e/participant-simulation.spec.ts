import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import ExcelJS from 'exceljs';
import { browserSpace, login, browserDatabase, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
async function enterDetails(page: Page, email: string) {
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Alex');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Simulation');
  await page.getByRole('textbox', { name: 'Adresse e-mail', exact: true }).fill(email);
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
}
test('tests a reservation, declined/successful payment, cancellation, voucher and manual deletion without live consequences', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, space);
  await page.goto(`/${space.slug}?from=appearance`);
  await expect(page).toHaveURL(`/simulation/${space.organizationId}`);
  await expect(page.getByText('Simulation participant — TEST', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Choisir une séance', exact: true }).click();
  await enterDetails(page, 'alex-simulation@example.invalid');
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(page.locator('.ice-result')).toContainText('Simulation participant — TEST');
  await page.goto(`/app/${space.organizationId}`);
  await expect(page.locator('.dashboard-tests')).toContainText('Mes réservations TEST · 1');
  await expect(page.locator('.portal-metric-link').nth(1).locator('strong')).toHaveText('0');
  await page.screenshot({ path: info.outputPath('dashboard-test-visible.png'), fullPage: true });
  await page.locator('.dashboard-test-list').click();
  await expect(page.getByText('Test incomplet', { exact: true })).toBeVisible();
  await page.locator('.simulation-card').getByRole('link', { name: 'Paiement de test', exact: true }).click();
  await page.getByRole('button', { name: 'Simuler un paiement refusé', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('refusé');
  await page.getByRole('button', { name: 'Simuler un paiement réussi', exact: true }).click();
  await expect(page.locator('.status-badge[data-tone="green"]')).toContainText('Test réussi');
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('test-reussi-mobile.png'), fullPage: true });
  await assertEmptyRealAccounting(page, space.organizationId);
  await cancelAndRemove(page, space);
});
test('rejects anonymous and cross-space simulation requests while keeping public booking pages public', async ({
  page,
  context,
}) => {
  const own = await browserSpace();
  const other = await browserSpace();
  await login(page, own);
  const response = await page.request.post(`/api/simulation/${other.organizationId}/payment`, {
    data: { bookingId: crypto.randomUUID(), success: true },
  });
  expect(response.status()).toBe(403);
  await anonymousAccess(context, own);
});
test('opens editable prefilled organizer conditions from the participant view and preserves changes', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/simulation/${space.organizationId}/activite/${space.activityId}`);
  await page.locator('#participant-terms summary').click();
  await page.getByRole('link', { name: 'Modifier les consignes et les règles de report' }).click();
  await expect(page.locator('#activity-edit')).toHaveAttribute('open', '');
  const field = page.locator('textarea[name="participationTerms"]');
  await expect(field).toHaveValue(/CONSIGNES DE PARTICIPATION/);
  await field.fill(
    'Merci d’apporter votre matériel. Pour une demande particulière de remboursement, contactez notre équipe.',
  );
  await page.locator('#activity-edit').getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.locator('#activity-edit').getByRole('status')).toBeVisible();
  await page.goto(`/simulation/${space.organizationId}/activite/${space.activityId}`);
  await page.locator('#participant-terms summary').click();
  await expect(page.locator('.ice-terms-text')).toContainText('Merci d’apporter votre matériel.');
});
test('keeps social symbols and availability colors clear on mobile and desktop', async ({ page }, info) => {
  const space = await browserSpace();
  await browserDatabase().query('UPDATE organizations SET social_links=$2 WHERE id=$1', [
    space.organizationId,
    JSON.stringify({
      instagram: 'https://instagram.com/example',
      tiktok: 'https://www.tiktok.com/@example',
      whatsapp: 'https://wa.me/32400000000',
    }),
  ]);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${space.slug}`);
    await expect(page.locator('.social-link')).toHaveCount(3);
    expect(
      await page
        .locator('.social-link')
        .first()
        .evaluate((el) => getComputedStyle(el, '::after').content),
    ).toBe('none');
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`catalogue-${width}.png`), fullPage: true });
  }
  await page.goto('/');
  await page.getByText('Comparer les fonctionnalités', { exact: true }).click();
  const included = page.locator('[data-availability="included"]').first();
  const absent = page.locator('[data-availability="absent"]').first();
  expect(await included.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
    await absent.evaluate((el) => getComputedStyle(el).backgroundColor),
  );
});

async function assertEmptyRealAccounting(page: Page, organizationId: string) {
  const real = await browserDatabase().query('SELECT id FROM bookings WHERE organization_id=$1', [organizationId]);
  expect(real.rows).toHaveLength(0);
  const api = await page.request.get(`/api/portal/accounting?organizationId=${organizationId}&format=xlsx`);
  expect(api.status()).toBe(200);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(await api.body()).buffer);
  expect(book.getWorksheet('Réservations')?.getCell('A5').value).toBe('Aucune opération');
}

async function cancelAndRemove(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  const manage = page
    .locator('.simulation-card')
    .getByRole('link', { name: 'Gérer cette réservation TEST', exact: true });
  const manageUrl = await manage.getAttribute('href');
  expect(manageUrl).toContain('/simulation/');
  await manage.click();
  await page.getByText('Annuler cette réservation', { exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Annuler ma réservation', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('annulée');
  await page.goto(`/app/${space.organizationId}/tests`);
  await expect(page.locator('.simulation-card')).toContainText('Code de report TEST');
  await page.getByRole('button', { name: 'Supprimer ce test', exact: true }).click();
  await expect(page.locator('.simulation-card')).toHaveCount(0);
  await page.goto(`/simulation/${space.organizationId}/activite/${space.activityId}`);
  await expect(page.locator('.ice-times')).toContainText('8 / 8');
}

async function anonymousAccess(context: BrowserContext, own: Awaited<ReturnType<typeof browserSpace>>) {
  const anon = await context.browser()?.newContext();
  if (!anon) throw Error('Browser required');
  try {
    const request = await anon.request.get(`/simulation/${own.organizationId}`);
    expect(request.status()).toBe(404);
    expect((await anon.request.get(`/${own.slug}?from=appearance`)).status()).toBe(404);
    expect(
      (
        await anon.request.post(`/api/simulation/${own.organizationId}/delete`, {
          data: { bookingId: crypto.randomUUID() },
        })
      ).status(),
    ).toBe(403);
    const publicPage = await anon.newPage();
    await publicPage.goto(`/${own.slug}/${own.activityId}`);
    await expect(publicPage.locator('.ice-booking-flow')).toBeVisible();
    await publicPage.locator('#participant-terms summary').click();
    await expect(publicPage.getByRole('link', { name: 'Modifier les consignes et les règles de report' })).toHaveCount(
      0,
    );
  } finally {
    await anon.close();
  }
}

test('simulates card checkout without external requests or a real merchant account', async ({ page }) => {
  const space = await browserSpace();
  await browserDatabase().query("UPDATE activities SET payment_mode='STRIPE' WHERE id=$1", [space.activityId]);
  await login(page, space);
  await page.goto(`/simulation/${space.organizationId}/activite/${space.activityId}`);
  await enterDetails(page, 'card-test@example.invalid');
  await page.getByRole('button', { name: 'Payer et réserver', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/simulation/${space.organizationId}/paiement/`));
  await page.getByRole('button', { name: 'Simuler un paiement réussi', exact: true }).click();
  await expect(page.locator('.simulation-card')).toContainText('Test réussi');
  const real = await browserDatabase().query('SELECT id FROM bookings WHERE organization_id=$1', [
    space.organizationId,
  ]);
  expect(real.rows).toHaveLength(0);
});
