import { expect, test, type Page } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  login,
  closeBrowserDatabase,
  noHorizontalOverflow,
} from './portal-fixtures';
import { bankSpace } from './bank-fixtures';
test.afterAll(closeBrowserDatabase);
async function editDetails(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  await page.goto(`/app/${space.organizationId}/activites/${space.activityId}`);
  await page.getByText('Modifier les informations', { exact: true }).click();
  await page.getByText('Détails pratiques de l’événement', { exact: true }).click();
  await page
    .getByLabel('Adresse ou lien de visioconférence', { exact: true })
    .fill('Private event address 789');
  await page.getByLabel('Envoyer l’adresse par e-mail 24 heures avant', { exact: true }).check();
  await page
    .getByLabel('Accès, matériel et consignes pratiques', { exact: true })
    .fill('Apporter un tablier');
  await page
    .getByLabel('Consignes de participation et droit au remboursement', { exact: true })
    .fill('Merci de respecter le matériel collectif.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistr');
}
async function saveSocials(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  await page.goto(`/app/${space.organizationId}/reglages`);
  await page.getByText('Réseaux et contact', { exact: true }).click();
  await page.getByLabel('Instagram', { exact: true }).fill('https://instagram.com/atelier-test');
  await page.getByLabel('WhatsApp', { exact: true }).fill('https://wa.me/32400000000');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistr');
}
test('saves organizer links and practical details without leaking a deferred address to participants', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await saveSocials(page, space);
  await editDetails(page, space);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/${space.slug}/${space.activityId}`);
    await expect(page.getByRole('link', { name: 'Instagram', exact: true })).toHaveAttribute(
      'href',
      'https://instagram.com/atelier-test',
    );
    await expect(page.getByText(/L’adresse et les modalités pratiques/)).toBeVisible();
    expect(await page.content()).not.toContain('Private event address');
    await page.locator('#participant-terms > summary').click();
    await expect(
      page.getByText('Merci de respecter le matériel collectif.', { exact: false }),
    ).toBeVisible();
    await noHorizontalOverflow(page);
    if (width === 390)
      await page.screenshot({ path: info.outputPath('event-details-mobile.png'), fullPage: true });
  }
  const response = await page.request.get(`/${space.slug}/${space.activityId}`);
  expect(await response.text()).not.toContain('Private event address');
});
test('grants one code from a cancelled paid attendee and displays readable payment and credit states', async ({
  page,
}, info) => {
  const space = await bankSpace();
  await browserDatabase().query(
    "UPDATE bookings SET status='CANCELLED_BY_ATTENDEE',amount_paid_cents=2500,confirmed_at=now(),paid_at=now() WHERE id=$1",
    [space.bookingId],
  );
  await login(page, space);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/app/${space.organizationId}/reservations`);
  const card = page.locator('.portal-booking-card');
  await card.locator('summary').click();
  await page
    .getByLabel('Expiration du code', { exact: true })
    .fill(new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10));
  await page
    .getByLabel('Je confirme l’attribution de cet avoir pour cette réservation.', { exact: true })
    .check();
  await page.getByRole('button', { name: 'Accorder un code de report', exact: true }).click();
  await expect(card.locator('code')).toContainText('RPT-');
  await expect(
    page.getByRole('button', { name: 'Accorder un code de report', exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await card.locator('summary').click();
  await expect(card.locator('code')).toHaveCount(1);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('attendee-credit-mobile.png'), fullPage: true });
  await verifyLinkedCode(page, space, await card.locator('code').innerText());
});

async function verifyLinkedCode(
  page: Page,
  space: Awaited<ReturnType<typeof bankSpace>>,
  code: string,
) {
  await browserDatabase().query('UPDATE activities SET price_cents=2000 WHERE id=$1', [
    space.activityId,
  ]);
  await page.goto(`/${space.slug}/${space.activityId}#voucher=${encodeURIComponent(code)}`);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(page.locator('.ice-total')).toContainText('0,00');
  await expect(page.getByRole('status')).toContainText('Un nouveau code sera créé pour le solde');
}
