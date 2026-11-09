import { expect, test } from '@playwright/test';
import { Pool } from 'pg';
const url = process.env['TEST_DATABASE_URL'];
if (!url || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/booking_test')
  throw Error('Local test database required');
const pool = new Pool({ connectionString: url });
test.afterAll(async () => {
  await pool.end();
});
test('books through the browser and persists exactly one unpaid confirmation', async ({
  page,
}, info) => {
  const path = process.env['BOOKING_TEST_PATH'];
  if (!path) throw Error('BOOKING_TEST_PATH required');
  const email = `browser-${crypto.randomUUID()}@example.com`;
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Couture');
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Marie');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Test');
  await page.getByRole('textbox', { name: 'Adresse e-mail', exact: true }).fill(email);
  await page
    .getByRole('textbox', { name: 'Téléphone d’urgence', exact: true })
    .fill('+32470123456');
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Votre place est réservée.' }),
  ).toContainText('Votre place est réservée.');
  await expect(page.locator('.ice-result-icon')).toHaveCount(0);
  await expect(page.locator('.ice-progress')).toHaveCount(0);
  await expect(page.getByText('À régler auprès de l’organisateur : 20,00 €')).toBeVisible();
  const result = await pool.query<{ status: string; amount_paid_cents: number }>(
    'SELECT status,amount_paid_cents FROM bookings WHERE email=$1',
    [email],
  );
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0]?.status).toBe('CONFIRMED');
  expect(result.rows[0]?.amount_paid_cents).toBe(0);
  await expect(page.getByRole('link', { name: 'Gérer ma réservation' })).toHaveAttribute(
    'href',
    /^\/manage#token=/,
  );
  await page.screenshot({ path: info.outputPath('booking-confirmed.png'), fullPage: true });
});
