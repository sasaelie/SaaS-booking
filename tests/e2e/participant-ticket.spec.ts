import { expect, test, type Page } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  noHorizontalOverflow,
  login,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('retries a temporary QR exchange failure without asking the participant to scan again', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await book(page, space);
  let attempts = 0;
  await page.route('**/api/participant/exchange', async (route) => {
    attempts++;
    if (attempts === 1)
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"success":false}',
      });
    else await route.continue();
  });
  await page.goto(`/manage#code=${encodeURIComponent(code)}`);
  await expect(page.getByRole('button', { name: 'Réessayer', exact: true })).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
  await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  expect(attempts).toBe(2);
});
async function book(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  await page.goto(`/${space.slug}/${space.activityId}`);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Alex');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Participant');
  await page
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill(`ticket-${crypto.randomUUID()}@example.com`);
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  const code = page.locator('.inline-booking-proof textarea');
  await expect(code).toHaveValue(/^CLI-/);
  return code.inputValue();
}
test('issues a printable ticket and exchanges the QR secret for a booking-scoped cookie', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  const code = await book(page, space);
  await page.goto(`/manage#code=${encodeURIComponent(code)}`);
  await expect(page).toHaveURL(/\/manage\?reservation=[a-f0-9-]+$/);
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  await expect(page.locator('.ticket-qr')).toBeVisible();
  await expect(page.getByText('Réservation confirmée · 1 place')).toBeVisible();
  await noHorizontalOverflow(page);
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === 'participant_booking',
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Strict');
  await page.screenshot({ path: info.outputPath('billet-mobile.png'), fullPage: true });
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Télécharger le billet PDF' })).toBeHidden();
  await page.pdf({ path: info.outputPath('billet-participant.pdf'), format: 'A4' });
});
test('finds a reservation through the participant tab without creating an organizer session', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await book(page, space);
  await page.goto('/connexion');
  await page.getByRole('link', { name: 'Participant', exact: true }).click();
  await page.getByLabel('Votre code de réservation').fill(code);
  await page.getByRole('button', { name: 'Retrouver ma réservation', exact: true }).click();
  await expect(page.locator('.participant-ticket')).toContainText('Alex Participant');
  const origin = new URL(page.url()).origin;
  const forbidden = await page.request.post('/api/self-service/context', {
    headers: { Origin: origin },
    data: { token: `participant:${crypto.randomUUID()}` },
  });
  expect(forbidden.status()).toBe(401);
  const csrf = await page.request.post('/api/participant/exchange', {
    headers: { Origin: 'https://foreign.example' },
    data: { code },
  });
  expect(csrf.status()).toBe(403);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/connexion/);
});
test('cancels through the protected participant session and exposes the existing report entitlement', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await book(page, space);
  await browserDatabase().query(
    'UPDATE bookings SET amount_paid_cents=2500,paid_at=now() WHERE organization_id=$1',
    [space.organizationId],
  );
  await page.goto(`/manage#code=${encodeURIComponent(code)}`);
  await page.getByText('Annuler cette réservation', { exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Annuler ma réservation', exact: true }).click();
  await expect(page.locator('.ticket-vouchers')).toContainText('25,00 €');
  await expect(page.locator('.ticket-vouchers code')).toHaveText(/^RPT-/);
  await expect(
    page.getByText('Réservation annulée — ce billet ne permet plus de participer.'),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  const rows = await browserDatabase().query(
    'SELECT status FROM bookings WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(rows.rows[0]?.status).toBe('CANCELLED_BY_ATTENDEE');
});
test('lets an authorized organizer retrieve an existing code and still open participant login', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await book(page, space);
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations`);
  await page.locator('.portal-booking-card summary').first().click();
  await page.getByRole('button', { name: 'Retrouver le code du participant' }).click();
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  await page.goto('/connexion?acces=participant');
  await expect(page.getByRole('heading', { name: 'Retrouver ma réservation' })).toBeVisible();
});
