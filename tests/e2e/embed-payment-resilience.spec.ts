import { expect, test, type Page } from '@playwright/test';
import { browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import {
  privatePreviewSpace,
  choosePrivatePreviewCourse,
  assertOnlyTestBooking,
} from './private-site-preview-fixtures';
import { completeEmbeddedBooking } from './embed-fixtures';
import { captureEmbeddedView } from './embed-capture';
import { BOOKING_UI } from '../../src/config/constants';
import { WEBSITE_PREVIEW as W } from '../../src/config/website-preview';
test.afterAll(closeBrowserDatabase);
test('keeps the host open, reuses pending checkout and displays confirmation only after the server confirms payment', async ({
  page,
  context,
}, info) => {
  const space = await startPayment(page);
  const frame = page.frameLocator('iframe');
  await expect(frame.getByText(BOOKING_UI.EMBEDDED_PAYMENT_NOTE, { exact: true })).toBeVisible();
  expect(context.pages()).toHaveLength(1);
  const link = frame.getByRole('link', { name: BOOKING_UI.CONTINUE_PAYMENT, exact: true });
  const url = await link.getAttribute('href');
  const first = context.waitForEvent('page');
  await link.click();
  const closed = await first;
  await expect(
    closed.getByRole('heading', { name: 'Paiement de test', exact: true }),
  ).toBeVisible();
  expect(await closed.evaluate(() => window.opener === null)).toBe(true);
  await closed.close();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText(BOOKING_UI.CHECKOUT_TITLE);
  await expect(link).toHaveAttribute('href', url ?? '');
  const next = context.waitForEvent('page');
  await link.click();
  await confirmPayment(await next);
  await page.bringToFront();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText(BOOKING_UI.SUCCESS_TITLE, {
    timeout: 15000,
  });
  await expect(link).toHaveCount(0);
  await expect(frame.locator('.participant-ticket')).toBeVisible();
  await expect(page).toHaveURL(W.PATH);
  await assertOnlyTestBooking(space.organizationId);
  await captureEmbeddedView(page, info, 'payment-confirmed-in-host.png');
});
async function startPayment(page: Page) {
  const space = await privatePreviewSpace();
  await browserDatabase().query(
    "UPDATE activities SET payment_mode='STRIPE',price_cents=2500 WHERE id=$1",
    [space.activityId],
  );
  await login(page, space);
  await page.goto(W.PATH);
  await choosePrivatePreviewCourse(page);
  await completeEmbeddedBooking(page, BOOKING_UI.PAY);
  return space;
}
async function confirmPayment(page: Page) {
  await page.getByRole('button', { name: 'Simuler un paiement réussi', exact: true }).click();
  await expect(page.locator('.simulation-card')).toContainText('Test réussi');
  await page.close();
}
