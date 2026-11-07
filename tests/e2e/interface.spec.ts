import { expect, test, type Page, type Route } from '@playwright/test';
async function openBooking(page: Page) {
  const path = process.env['BOOKING_TEST_PATH'];
  if (!path) throw Error('BOOKING_TEST_PATH required');
  await page.goto(path);
}
async function mockVoucherQuote(route: Route) {
  const body: unknown = route.request().postDataJSON();
  const valid =
    typeof body === 'object' && body !== null && 'code' in body && body.code === 'RPT-TEST-ABCD';
  await route.fulfill({
    status: valid ? 200 : 400,
    contentType: 'application/json',
    body: JSON.stringify(valid ? { remainingToPayCents: 0 } : { error: 'invalid' }),
  });
}
test('supports month navigation, keyboard selection and preserved contact details on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const issues: string[] = [];
  page.on('pageerror', (error) => issues.push(error.message));
  await openBooking(page);
  const next = page.getByRole('button', { name: 'Mois suivant', exact: true });
  if (await next.isEnabled()) await next.click();
  const day = page.locator('.ice-calendar-day:not(:disabled)').last();
  await day.focus();
  await day.press('Enter');
  const selection = await page.locator('input[name="startsAtIso"]').inputValue();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill('mobile@example.com');
  await page.getByRole('button', { name: 'Modifier la séance', exact: true }).click();
  await expect(page.locator('input[name="startsAtIso"]')).toHaveValue(selection);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Adresse e-mail', exact: true })).toHaveValue(
    'mobile@example.com',
  );
  await expect(
    page.getByRole('textbox', { name: 'Téléphone d’urgence', exact: true }),
  ).toHaveAttribute('required');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(issues).toEqual([]);
});
test('updates the checkout total after a voucher quote and rejects an invalid code', async ({
  page,
}) => {
  await openBooking(page);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Vous avez un code de report ?' }).click();
  await page.route('**/api/voucher-quote', mockVoucherQuote);
  const input = page.getByRole('textbox', { name: 'Code de report', exact: true });
  await input.fill('RPT-TEST-ABCD');
  await input.press('Tab');
  await expect(page.locator('.ice-total')).toContainText('0,00');
  await expect(page.getByRole('button', { name: 'Confirmer ma place', exact: true })).toBeEnabled();
  await input.fill('INVALID');
  await input.press('Tab');
  await expect(page.getByRole('status')).toContainText('Ce code est indisponible ou expiré.');
  await expect(page.locator('.ice-total')).toContainText('20,00');
  await expect(
    page.getByRole('button', { name: 'Confirmer ma place', exact: true }),
  ).toBeDisabled();
  await input.fill('');
  await expect(page.getByRole('button', { name: 'Confirmer ma place', exact: true })).toBeEnabled();
});
