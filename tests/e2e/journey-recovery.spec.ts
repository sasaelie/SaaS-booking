import { expect, test, type Page } from '@playwright/test';
import { drizzle } from 'drizzle-orm/node-postgres';
import { browserSpace, browserDatabase, closeBrowserDatabase } from './portal-fixtures';
import { reserveAuditSeat } from './journey-audit-fixtures';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
test.afterAll(closeBrowserDatabase);
async function lastSeatSpace() {
  const space = await browserSpace();
  await browserDatabase().query('UPDATE sessions SET capacity=1 WHERE activity_id=$1', [
    space.activityId,
  ]);
  const nextDate = new Date(space.date.getTime() + 86400000);
  required(
    await new DrizzlePortalRepository(drizzle(browserDatabase())).addSession(space.actor, {
      organizationId: space.organizationId,
      activityId: space.activityId,
      startsAt: nextDate,
      endsAt: new Date(nextDate.getTime() + 7200000),
      capacity: 2,
    }),
  );
  return space;
}
async function completeContact(page: Page, email: string) {
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Camille');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Dernière place');
  await page.getByRole('textbox', { name: 'Adresse e-mail', exact: true }).fill(email);
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
}
test('recovers from a real last-seat collision without losing contacts or creating an extra reservation', async ({
  page,
}) => {
  const space = await lastSeatSpace();
  const email = `collision-${crypto.randomUUID()}@example.com`;
  await page.goto(`/${space.slug}/${space.activityId}`);
  await completeContact(page, email);
  await reserveAuditSeat(space);
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmer ma place', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Modifier la séance', exact: true }).click();
  const next = page.getByRole('button', { name: 'Mois suivant', exact: true });
  if (await next.isEnabled()) await next.click();
  await page.locator('.ice-calendar-day:not(:disabled)').last().click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Adresse e-mail', exact: true })).toHaveValue(
    email,
  );
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Votre place est réservée.');
  const result = await browserDatabase().query('SELECT status FROM bookings WHERE email=$1', [
    email,
  ]);
  expect(result.rows).toEqual([{ status: 'CONFIRMED' }]);
});
