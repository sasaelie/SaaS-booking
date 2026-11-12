import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { browserSpace, browserDatabase, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('opens every dashboard metric and shows simulation access without mixing real bookings', async ({ page }) => {
  const s = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, s);
  await page.goto(`/app/${s.organizationId}`);
  const metrics = page.locator('.portal-metric-link');
  await expect(metrics).toHaveCount(4);
  const expected = [
    `/app/${s.organizationId}/activites/${s.activityId}`,
    `/app/${s.organizationId}/reservations?status=UPCOMING`,
    `/app/${s.organizationId}/reservations?status=PROOF_SUBMITTED`,
    `/app/${s.organizationId}/reservations?status=REFUND_PENDING`,
  ];
  for (let i = 0; i < 4; i++) {
    await page.goto(`/app/${s.organizationId}`);
    if (i === 0) {
      await metrics.nth(i).focus();
      await page.keyboard.press('Enter');
    } else await metrics.nth(i).click();
    await expect(page).toHaveURL(expected[i] ?? '');
  }
  await page.goto(`/app/${s.organizationId}`);
  await expect(page.locator('.dashboard-tests')).toContainText('Mes réservations TEST · 0');
  await page.locator('.dashboard-test-list').click();
  await expect(page).toHaveURL(`/app/${s.organizationId}/tests`);
  await expect(page.getByText('Aucune réservation de test.', { exact: false })).toBeVisible();
});
test('saves a valid contact number, shows a call link publicly, rejects invalid input and allows clearing', async ({
  page,
}) => {
  const s = await browserSpace();
  await login(page, s);
  await page.goto(`/app/${s.organizationId}/reglages`);
  await page.getByText('Réseaux et contact', { exact: true }).click();
  const field = page.getByLabel('Numéro de téléphone de contact', { exact: true });
  await field.fill('0470 12 34 56');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).first().click();
  await expect(page.getByRole('status')).toContainText('enregistrées');
  await page.reload();
  await page.getByText('Réseaux et contact', { exact: true }).click();
  await expect(field).toHaveValue('+32470123456');
  await page.goto(`/${s.slug}`);
  await expect(page.getByRole('link', { name: 'Téléphone', exact: true })).toHaveAttribute('href', 'tel:+32470123456');
  await page.goto(`/app/${s.organizationId}/reglages`);
  await page.getByText('Réseaux et contact', { exact: true }).click();
  await field.fill('invalid');
  expect(await field.evaluate((el) => (el as HTMLInputElement).checkValidity())).toBe(false);
  await field.fill('');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).first().click();
  await expect(page.getByRole('status')).toContainText('enregistrées');
  await page.goto(`/${s.slug}`);
  await expect(page.getByRole('link', { name: 'Téléphone', exact: true })).toHaveCount(0);
});
test('keeps customized participant content close to the top, with transparent vignette, soft controls and clean links', async ({
  page,
}, info) => {
  const s = await browserSpace();
  await browserDatabase().query('UPDATE organization_branding SET participant_hue=326 WHERE organization_id=$1', [
    s.organizationId,
  ]);
  await login(page, s);
  await uploadPattern(page, s.organizationId);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/${s.slug}`);
    await expectTop(page);
    await noHorizontalOverflow(page);
    const overlay = await page
      .locator('.catalog-activity')
      .evaluate((el) => getComputedStyle(el, '::before').backgroundImage);
    expect(overlay).toContain('radial-gradient');
    expect(overlay).not.toContain('255, 253, 244');
    await page.screenshot({ path: info.outputPath(`catalogue-vignette-${width}.png`), fullPage: true });
    await page.getByRole('link', { name: 'Choisir une séance', exact: true }).click();
    await expect(page).toHaveURL(`/${s.slug}/${s.activityId}`);
    await expect(page.locator('.ice-booking-flow')).toBeVisible();
    await expectTop(page);
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`reservation-compacte-${width}.png`), fullPage: true });
  }
  await expectSimulationHeader(page, s.organizationId, s.activityId, info.outputPath('simulation-compacte.png'));
});
async function expectSimulationHeader(page: Page, id: string, activityId: string, path: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/simulation/${id}/activite/${activityId}`);
  await expect(page.locator('.simulation-notice')).toContainText('Simulation participant — TEST');
  await expect(page.locator('.ice-branded-page')).toHaveCSS('isolation', 'auto');
  expect((await page.locator('.simulation-notice').boundingBox())?.height).toBeLessThan(180);
  expect((await page.locator('.ice-brand-name').boundingBox())?.y).toBeLessThan(380);
  await page.screenshot({ path, fullPage: true });
}
async function expectTop(page: Page) {
  await expect(page.locator('.participant-navigation a')).toBeVisible();
  const box = await page.locator('.ice-brand-name').boundingBox();
  expect(box?.y).toBeLessThan(180);
  await expect(page.locator('.staging-notice')).toBeVisible();
  await expect(page.locator('.ice-branded-page')).toHaveCSS('isolation', 'auto');
  const links = await page.locator('main a').evaluateAll((nodes) =>
    nodes
      .filter((el) => el.getClientRects().length)
      .map((el) => ({
        href: el.getAttribute('href'),
        text: el.textContent,
        decoration: getComputedStyle(el).textDecorationLine,
        display: getComputedStyle(el).display,
      })),
  );
  expect(links.length).toBeGreaterThan(0);
  expect(links.filter((link) => link.decoration !== 'none')).toEqual([]);
}
async function uploadPattern(page: Page, id: string) {
  await page.goto(`/app/${id}/parametres`);
  await page.getByText('Logo et photo de présentation', { exact: true }).click();
  const panel = page
    .locator('.portal-panel')
    .filter({ has: page.getByRole('heading', { name: 'Photo de l’encart de présentation' }) })
    .last();
  const image = await sharp(
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700"><rect width="600" height="700" fill="#174a34"/><path d="M0 0H300L0 300ZM600 0V400L350 0ZM0 700H600L300 500Z" fill="#a35b43"/><circle cx="300" cy="320" r="85" fill="#a35b43"/></svg>',
    ),
  )
    .png()
    .toBuffer();
  await panel
    .locator('input[type=file]')
    .setInputFiles({ name: 'motif-test.png', mimeType: 'image/png', buffer: image });
  await panel.getByRole('button', { name: 'Importer l’image', exact: true }).click();
  await expect(page.locator('.appearance-story-preview img')).toBeVisible();
}
