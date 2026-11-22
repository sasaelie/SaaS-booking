import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { reserveAuditSeat } from './journey-audit-fixtures';
import { bankSpace } from './bank-fixtures';
test.afterAll(closeBrowserDatabase);
test('groups every existing organizer route under five clear primary sections', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reglages`);
  await expect(page.locator('.portal-nav-sections > a')).toHaveText([
    'Vue d’ensemble',
    'Activités',
    'Participants',
    'Partager',
    'Réglages',
  ]);
  await expect(page.getByRole('navigation', { name: 'Réglages', exact: true })).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const suffix of ['/reglages', '/parametres', '/abonnement', '/partager']) {
      await page.goto(`/app/${space.organizationId}${suffix}`);
      await expect(page.locator('main h1')).toBeVisible();
      await noHorizontalOverflow(page);
    }
    await expect(page.getByRole('link', { name: 'Aperçu et tests', exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`sharing-${width}.png`), fullPage: true });
  }
  await page.getByRole('link', { name: 'Aperçu et tests', exact: true }).click();
  await expect(page).toHaveURL(`/app/${space.organizationId}/tests`);
});
test('records received cash from a booking and safely confirms an occupied session edit', async ({
  page,
}, info) => {
  const space = await browserSpace();
  const booking = await reserveAuditSeat(space);
  await login(page, space);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/app/${space.organizationId}/reservations`);
  await page.locator('.portal-booking-card > summary').click();
  await page.locator('summary').filter({ hasText: 'Règlement sur place' }).click();
  await page.getByLabel('Référence de votre reçu').fill('RECU-BROWSER-1');
  await page.getByLabel('Je confirme avoir reçu ce règlement.', { exact: true }).check();
  await page.getByRole('button', { name: 'Enregistrer le règlement reçu', exact: true }).click();
  await expect.poll(() => recordedAmount(booking.bookingId)).toBe(2500);
  await page.goto(
    `/app/${space.organizationId}/seances/${space.activityId}?startsAt=${encodeURIComponent(space.date.toISOString())}`,
  );
  await page.locator('summary').filter({ hasText: 'Modifier cette séance' }).click();
  await page.getByLabel('Nombre de places', { exact: true }).fill('9');
  await page.getByRole('button', { name: 'Enregistrer la séance', exact: true }).click();
  await expect(
    page.getByText('Les billets garderont leur code et leur tarif.', { exact: false }),
  ).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('edit-impact-mobile.png'), fullPage: true });
  await page.getByLabel('Je confirme cette opération.', { exact: true }).check();
  await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await browserDatabase().query(
            'SELECT capacity FROM sessions WHERE activity_id=$1 AND starts_at=$2',
            [space.activityId, space.date],
          )
        ).rows[0]?.capacity,
    )
    .toBe(9);
});

async function recordedAmount(bookingId: string) {
  const result = await browserDatabase().query<{ amount_paid_cents: number }>(
    'SELECT amount_paid_cents FROM bookings WHERE id=$1',
    [bookingId],
  );
  return result.rows[0]?.amount_paid_cents;
}
test('confirms a bank transfer from the organizer account without a participant screenshot', async ({
  page,
}) => {
  const space = await bankSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations`);
  await page.locator('.portal-booking-card > summary').click();
  await page
    .getByLabel('Référence du virement reçu (relevé bancaire)', { exact: true })
    .fill('EXTRAIT-BROWSER-1');
  await page.getByRole('button', { name: 'Confirmer le virement', exact: true }).click();
  await expect.poll(() => recordedAmount(space.bookingId)).toBe(2500);
});
