import { expect, test } from '@playwright/test';
import { browserSpace, browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import { bankSpace } from './bank-fixtures';
import { addAuditActivity } from './action-audit-fixtures';
test.afterAll(closeBrowserDatabase);
test('saves the chosen Liberty activities and applies them after Pro is removed', async ({
  page,
}) => {
  const space = await browserSpace();
  const second = await addAuditActivity(space, 'Deuxième activité');
  const third = await addAuditActivity(space, 'Troisième activité');
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/abonnement`);
  await page.getByLabel('Deuxième activité', { exact: true }).check();
  await page.getByLabel('Troisième activité', { exact: true }).check();
  await page.getByRole('button', { name: 'Enregistrer mes activités', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistrées');
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=false WHERE organization_id=$1',
    [space.organizationId],
  );
  await page.getByRole('button', { name: 'Actualiser l’état', exact: true }).click();
  await expect(page.locator('#choix-formule .portal-badge')).toHaveText('Liberté');
  const row = (
    await browserDatabase().query(
      'SELECT liberty_activity_ids FROM organization_access WHERE organization_id=$1',
      [space.organizationId],
    )
  ).rows[0];
  expect(row.liberty_activity_ids.sort()).toEqual([second.activityId, third.activityId].sort());
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toBeDisabled();
  await expect(
    page.getByText(
      'Les réservations sont actuellement fermées. Contactez l’organisateur pour toute question.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto(`/${space.slug}/${second.activityId}`);
  await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toBeVisible();
});
test('consumes a course-exchange voucher once through the Pro form and refuses a second use', async ({
  page,
}) => {
  const space = await bankSpace();
  const code = `RPT-${crypto.randomUUID()}`.toUpperCase();
  await browserDatabase().query(
    'UPDATE activities SET allow_external_benefit_exchange=true WHERE id=$1',
    [space.activityId],
  );
  await browserDatabase().query(
    "UPDATE bookings SET status='CANCELLED_BY_ATTENDEE',amount_paid_cents=2500,locked_until=null WHERE id=$1",
    [space.bookingId],
  );
  await browserDatabase().query(
    "INSERT INTO reschedule_vouchers(organization_id,origin_activity_id,origin_booking_id,code,initial_value_cents,currency,expires_at) VALUES($1,$2,$3,$4,2500,'EUR',now()+interval '2 months')",
    [space.organizationId, space.activityId, space.bookingId, code],
  );
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/abonnement`);
  await page.getByText('Valider un report pour un cours en ligne', { exact: true }).click();
  await page.getByLabel('Code de report', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Valider le report', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistrées');
  expect(
    (await browserDatabase().query('SELECT status FROM reschedule_vouchers WHERE code=$1', [code]))
      .rows[0].status,
  ).toBe('USED_FOR_EXTERNAL_BENEFIT');
  await page.getByRole('button', { name: 'Valider le report', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('records one real exceptional cost through the administrator form', async ({ page }) => {
  const space = await browserSpace();
  const reference = `COST-${crypto.randomUUID()}`;
  await login(page, space);
  await page.goto(`/plateforme?search=${space.slug}`);
  await page.getByText('Rapprocher un coût exceptionnel réel', { exact: true }).click();
  await page.getByLabel('Espace concerné', { exact: false }).selectOption(space.organizationId);
  await page.getByLabel('Montant réel (€)', { exact: true }).fill('1,23');
  await page.getByLabel('Référence du justificatif', { exact: true }).fill(reference);
  await page
    .getByLabel('Date du coût', { exact: true })
    .fill(new Date().toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Enregistrer le coût', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistrées');
  expect(
    (
      await browserDatabase().query(
        'SELECT organization_id,amount_cents FROM platform_costs WHERE source_reference=$1',
        [reference],
      )
    ).rows,
  ).toEqual([{ organization_id: space.organizationId, amount_cents: 123 }]);
});
