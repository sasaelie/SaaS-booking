import { expect, test, type Locator } from '@playwright/test';
import { browserSpace, browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import { bankSpace } from './bank-fixtures';
import { reserveAuditSeat } from './journey-audit-fixtures';
test.afterAll(closeBrowserDatabase);
test('applies attendee search and payment filters through the filter button', async ({ page }) => {
  const space = await bankSpace();
  await reserveAuditSeat(space);
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/reservations`);
  await expect(page.locator('.portal-booking-card')).toHaveCount(2);
  await page.getByLabel('Rechercher', { exact: true }).fill('Alex');
  await page.getByRole('button', { name: 'Filtrer', exact: true }).click();
  await expect(page.locator('.portal-booking-card')).toHaveCount(1);
  await expect(page.locator('.portal-booking-card')).toContainText('Alex Test');
  await page.getByLabel('État', { exact: true }).selectOption('PAYMENT_RECEIVED');
  await page.getByRole('button', { name: 'Filtrer', exact: true }).click();
  await expect(page.locator('.portal-booking-card')).toHaveCount(0);
  await page.getByLabel('État', { exact: true }).selectOption('PAYMENT_DUE');
  await page.getByRole('button', { name: 'Filtrer', exact: true }).click();
  await expect(page.locator('.portal-booking-card')).toHaveCount(1);
  await page.getByLabel('Rechercher', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Filtrer', exact: true }).click();
  await expect(page.locator('.portal-booking-card')).toHaveCount(2);
});
test('revokes, grants, suspends and restores actual access through administrator buttons', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/plateforme?search=${space.slug}`);
  const card = page.getByRole('article').filter({ hasText: space.slug });
  await card.getByText('Gérer l’accès', { exact: true }).click();
  await operate(card, 'Retirer l’accès offert');
  await expect(
    card.getByRole('button', { name: 'Accorder un accès offert', exact: true }),
  ).toBeVisible();
  expect(
    (
      await page.request.get(`/api/portal/accounting?organizationId=${space.organizationId}`)
    ).status(),
  ).toBe(403);
  await operate(card, 'Accorder un accès offert');
  await expect(card.getByText('Accès offert', { exact: true })).toBeVisible();
  await operate(card, 'Suspendre les nouvelles réservations');
  await expect(card.getByText('Suspendu', { exact: true })).toBeVisible();
  await operate(card, 'Lever la suspension');
  await expect(
    card.getByRole('button', { name: 'Suspendre les nouvelles réservations', exact: true }),
  ).toBeVisible();
  const row = (
    await browserDatabase().query(
      'SELECT complimentary,suspended_at FROM organization_access WHERE organization_id=$1',
      [space.organizationId],
    )
  ).rows[0];
  expect(row).toMatchObject({ complimentary: true, suspended_at: null });
});
async function operate(card: Locator, name: string) {
  const form = card.locator('form').filter({ hasText: name });
  await form.getByRole('checkbox').check();
  await form.getByRole('button').click();
}
