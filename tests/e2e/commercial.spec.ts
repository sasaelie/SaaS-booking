import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
async function libertySpace() {
  const space = await browserSpace();
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=false WHERE organization_id=$1',
    [space.organizationId],
  );
  await browserDatabase().query('UPDATE activities SET price_cents=0 WHERE id=$1', [
    space.activityId,
  ]);
  return space;
}
test('shows both offers clearly on mobile and enforces Pro routes for a Liberty organizer', async ({
  page,
}, info) => {
  const space = await libertySpace();
  await login(page, space);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/app/${space.organizationId}/abonnement`);
  await expect(page.getByRole('heading', { name: 'Liberté', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Studio Pro', exact: true })).toBeVisible();
  await expect(
    page.getByText('3,5 % + 0,45 € par réservation payée, sans plafond.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Votre comparaison sur les 30 derniers jours' }),
  ).toBeVisible();
  await noHorizontalOverflow(page);
  expect(
    (
      await page.request.get(`/api/portal/accounting?organizationId=${space.organizationId}`)
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.get(`/api/portal/qr?organizationId=${space.organizationId}&format=pdf`)
    ).status(),
  ).toBe(403);
  await page.screenshot({ path: info.outputPath('liberte-mobile.png'), fullPage: true });
  await page.goto(`/${space.slug}`);
  await expect(
    page.getByRole('link', { name: 'Propulsé par Studio Créatif 360', exact: true }),
  ).toBeVisible();
  await noHorizontalOverflow(page);
});
test('offers a vector QR PDF, real accounting export and unbranded public pages to Pro', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  const pdf = await page.request.get(
    `/api/portal/qr?organizationId=${space.organizationId}&format=pdf`,
  );
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toBe('application/pdf');
  expect((await pdf.body()).subarray(0, 8).toString()).toContain('%PDF-1.4');
  const csv = await page.request.get(
    `/api/portal/accounting?organizationId=${space.organizationId}`,
  );
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain('stripe_reel_centimes');
  await page.goto(`/${space.slug}`);
  await expect(
    page.getByRole('link', { name: 'Propulsé par Studio Créatif 360', exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/app/${space.organizationId}/abonnement`);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('pro-desktop.png'), fullPage: true });
});
test('publishes only two reservable activities through authenticated API calls', async ({
  page,
}) => {
  const space = await libertySpace();
  await login(page, space);
  const input = {
    organizationId: space.organizationId,
    name: 'Activité gratuite',
    description: '',
    priceCents: 0,
    audiencePolicy: 'ALL_PUBLIC',
    paymentMode: 'NONE',
    requirePhone: false,
    bookingWindowWeeks: 4,
    noticeHoursForVoucher: 72,
    voucherValidityMonths: 2,
    schedule: {
      kind: 'WEEKLY',
      slots: [{ dayOfWeek: 3, startTimeLocal: '14:00', endTimeLocal: '16:00', capacity: 5 }],
    },
  };
  const options = {
    headers: { Origin: new URL(page.url()).origin },
    data: { action: 'create-activity', input },
  };
  expect((await page.request.post('/api/portal/command', options)).status()).toBe(200);
  const third = await page.request.post('/api/portal/command', options);
  expect(third.status()).toBe(400);
  expect(await third.json()).toMatchObject({ success: false, code: 'SUBSCRIPTION_REQUIRED' });
  await page.goto(`/embed/${space.slug}/${space.activityId}`);
  await expect(
    page.getByText('La réservation est temporairement indisponible.', { exact: true }),
  ).toBeVisible();
});
test('books a free Liberty activity without a gateway debit and persists the financial snapshot', async ({
  page,
}) => {
  const space = await libertySpace();
  const email = `liberty-${crypto.randomUUID()}@example.com`;
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(
    page.getByRole('link', { name: 'Propulsé par Studio Créatif 360', exact: true }),
  ).toBeVisible();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Marie');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Test');
  await page.getByRole('textbox', { name: 'Adresse e-mail', exact: true }).fill(email);
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Gérer ma réservation', exact: true })).toBeVisible();
  const result = await browserDatabase().query(
    'SELECT status,commercial_plan,commission_cents,amount_paid_cents FROM bookings WHERE organization_id=$1 AND email=$2',
    [space.organizationId, email],
  );
  expect(result.rows).toEqual([
    expect.objectContaining({
      status: 'CONFIRMED',
      commercial_plan: 'LIBERTE',
      commission_cents: 0,
      amount_paid_cents: 0,
    }),
  ]);
});
