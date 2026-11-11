import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { browserSpace, browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import { bankSpace } from './bank-fixtures';
test.afterAll(closeBrowserDatabase);
test('adds and removes weekly rows before publishing exactly the remaining schedule', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites/nouvelle`);
  await page.getByLabel('Titre de l’activité', { exact: true }).fill('Programme récurrent testé');
  await page.getByLabel('Tarif par personne (€)', { exact: true }).fill('0');
  await page.getByRole('radio', { name: 'Des séances récurrentes', exact: true }).check();
  await page.getByRole('button', { name: 'Ajouter un créneau', exact: true }).click();
  await expect(page.locator('.portal-slot-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Retirer ce créneau', exact: true }).last().click();
  await expect(page.locator('.portal-slot-row')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Retirer ce créneau', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Créer et publier', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('Programme récurrent testé');
  const id = page.url().split('/').pop();
  expect(
    (
      await browserDatabase().query(
        'SELECT count(*)::int AS count FROM time_slots WHERE activity_id=$1',
        [id],
      )
    ).rows[0].count,
  ).toBe(1);
});
test('removes an uploaded logo and updates both the database and public branding', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/parametres`);
  await page.getByText('Logo et photo de présentation', { exact: true }).click();
  const group = page
    .locator('.portal-panel')
    .filter({ has: page.getByRole('heading', { name: 'Logo de l’organisation', exact: true }) })
    .last();
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: 'white' } })
    .png()
    .toBuffer();
  await group
    .locator('input[type=file]')
    .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: bytes });
  await group.getByRole('button', { name: 'Importer l’image', exact: true }).click();
  await expect(group.getByRole('button', { name: 'Retirer', exact: true })).toBeVisible();
  await group.getByRole('button', { name: 'Retirer', exact: true }).click();
  await expect(group.getByRole('button', { name: 'Retirer', exact: true })).toHaveCount(0);
  expect(
    (
      await browserDatabase().query(
        'SELECT logo_storage_key FROM organization_branding WHERE organization_id=$1',
        [space.organizationId],
      )
    ).rows[0].logo_storage_key,
  ).toBeNull();
  expect((await page.request.get(`/api/branding/${space.organizationId}/logo`)).status()).toBe(404);
});
test('records the completed manual refund and removes the pending refund controls', async ({
  page,
}) => {
  const space = await bankSpace();
  await browserDatabase().query(
    "UPDATE bookings SET status='CANCELLED_BY_ORGANIZER',amount_paid_cents=2500,refund_status='MANUAL_PENDING',paid_at=now(),locked_until=null WHERE id=$1",
    [space.bookingId],
  );
  await browserDatabase().query(
    "UPDATE financial_payments SET organization_net_cents=2500,stripe_fee_cents=0,status='RECONCILED',paid_at=now() WHERE booking_id=$1",
    [space.bookingId],
  );
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations`);
  await page.locator('.portal-booking-card > summary').click();
  await page
    .getByLabel('Référence du remboursement bancaire effectué', { exact: true })
    .fill('REFUND-TEST-123');
  await page
    .getByLabel('Je confirme avoir effectué ce remboursement sur le compte bancaire.', {
      exact: true,
    })
    .check();
  const response = page.waitForResponse((r) => r.url().endsWith('/api/portal/command'));
  await page
    .getByRole('button', { name: 'Enregistrer le remboursement effectué', exact: true })
    .click();
  expect(await (await response).json()).toMatchObject({ success: true });
  await expect(
    page.getByRole('button', { name: 'Enregistrer le remboursement effectué', exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await browserDatabase().query('SELECT refund_status,refund_id FROM bookings WHERE id=$1', [
        space.bookingId,
      ])
    ).rows[0],
  ).toMatchObject({ refund_status: 'MANUAL_DONE', refund_id: 'REFUND-TEST-123' });
});
test('rejects a submitted transfer proof through the red action without confirming payment', async ({
  page,
}) => {
  const space = await bankSpace();
  await page.goto(`/manage#token=${encodeURIComponent(space.token)}`);
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: 'white' } })
    .png()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: bytes });
  await page.getByRole('button', { name: 'Envoyer le justificatif', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Votre justificatif a été reçu' }),
  ).toBeVisible();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations`);
  await page.locator('.portal-booking-card > summary').click();
  await page.getByRole('button', { name: 'Refuser le virement', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Confirmer le virement', exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await browserDatabase().query('SELECT status,amount_paid_cents FROM bookings WHERE id=$1', [
        space.bookingId,
      ])
    ).rows[0],
  ).toMatchObject({ status: 'CANCELLED_BY_ORGANIZER', amount_paid_cents: 0 });
});
