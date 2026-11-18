import { expect, test, type Page } from '@playwright/test';
import { browserSpace, login, browserDatabase, closeBrowserDatabase } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
async function createTest(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  await login(page, space);
  await page.goto(`/simulation/${space.organizationId}/activite/${space.activityId}`);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Alex');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Test');
  await page
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill('simulation-login@example.invalid');
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  const code = page.locator('.inline-booking-proof textarea');
  await expect(code).toHaveValue(/^TEST-/);
  return code.inputValue();
}
async function logout(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  await expect(page).toHaveURL('/connexion');
  expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
}
async function submitCode(page: Page, code: string, origin = '') {
  await page.goto(`${origin}/connexion?acces=participant`);
  await page.getByLabel('Votre code de réservation').fill(code);
  await page.getByRole('button', { name: 'Retrouver ma réservation', exact: true }).click();
}
async function expectGuestTicket(page: Page, code: string) {
  await expect(page).toHaveURL(/\/manage\?test=1#token=/);
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  await expect(page.locator('.ticket-test')).toContainText('TEST');
  expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
  expect((await page.context().cookies()).some((c) => c.name.includes('participant_booking'))).toBe(
    false,
  );
}
test('opens a TEST code after organizer logout, preserves the logout and works after refresh', async ({
  page,
}) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  const code = await createTest(page, space);
  await logout(page);
  await submitCode(page, code);
  await expectGuestTicket(page, code);
  await page.reload();
  await expectGuestTicket(page, code);
  await expect(
    page.getByRole('link', { name: 'Enregistrer le billet PDF', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Retour à la connexion participant' }),
  ).toHaveAttribute('href', '/connexion?acces=participant');
  const rows = await browserDatabase().query(
    'SELECT count(*) FROM bookings WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(rows.rows[0]?.count).toBe('0');
  await page.goto('/app');
  await expect(page).toHaveURL('/connexion');
});
test('accepts a TEST capability in a fresh browser without granting organizer operations', async ({
  page,
  browser,
}) => {
  const space = await browserSpace();
  const code = await createTest(page, space);
  const origin = new URL(page.url()).origin;
  const visitor = await browser.newContext({ baseURL: origin });
  try {
    const guest = await visitor.newPage();
    await submitCode(guest, code);
    await expectGuestTicket(guest, code);
    const token = new URL(guest.url()).hash.slice('#token='.length);
    await checkIsolatedAccess(guest, space.organizationId, decodeURIComponent(token));
    const changed = code.slice(0, -1) + (code.endsWith('A') ? 'B' : 'A');
    await submitCode(guest, changed);
    await expect(guest.getByText('Code invalide ou accès terminé.', { exact: true })).toBeVisible();
  } finally {
    await visitor.close();
  }
});
async function checkIsolatedAccess(page: Page, id: string, token: string) {
  const origin = new URL(page.url()).origin;
  const requests = [
    { url: '/api/self-service/context', data: { token }, status: 401 },
    {
      url: `/api/simulation/${id}/payment`,
      data: { bookingId: crypto.randomUUID(), success: true },
      status: 401,
    },
    { url: `/api/simulation/${id}/delete`, data: { bookingId: crypto.randomUUID() }, status: 401 },
    { url: '/api/participant/test/payment', data: { token }, status: 400 },
    { url: '/api/participant/test/context', data: { token: token + 'modified' }, status: 401 },
  ];
  for (const request of requests) {
    const response = await page.request.post(request.url, {
      data: request.data,
      headers: { Origin: origin },
    });
    expect(response.status()).toBe(request.status);
  }
  const crossOrigin = await page.request.post('/api/participant/test/context', {
    data: { token },
    headers: { Origin: 'https://foreign.example.invalid' },
  });
  expect(crossOrigin.status()).toBe(403);
}
test('opens current and older TEST QR links after logout without requiring the organizer layout', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await createTest(page, space);
  await logout(page);
  for (const path of ['/manage', '/manage?test=1', `/simulation/${space.organizationId}/gestion`]) {
    await page.goto(`${path}#code=${encodeURIComponent(code)}`);
    await expectGuestTicket(page, code);
    await page.reload();
    await expectGuestTicket(page, code);
  }
});
test('cancels only the represented TEST booking while leaving real bookings and organizer access untouched', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await createTest(page, space);
  await logout(page);
  await submitCode(page, code);
  await expectGuestTicket(page, code);
  await page.getByText('Annuler cette réservation', { exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Annuler ma réservation', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'annulée' })).toContainText('annulée');
  await page.reload();
  await expect(page.getByText('Annulée par le participant', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Utiliser ce report', exact: true })).toHaveCount(0);
  const rows = await browserDatabase().query(
    'SELECT count(*) FROM bookings WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(rows.rows[0]?.count).toBe('0');
  expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
});
