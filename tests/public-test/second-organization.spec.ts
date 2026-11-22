import { expect, test } from '@playwright/test';
import { externalWebsite, completeEmbeddedBooking } from '../e2e/embed-fixtures';
import { BOOKING_UI, SHARE_UI } from '../../src/config/constants';
import { PUBLIC_TEST } from '../../src/config/public-test';
test('books a newly published organization without changing the deployment or mixing its tariff', async ({
  page,
  baseURL,
}) => {
  const slug = process.env['TEST_SECONDARY_ORGANIZATION_SLUG'];
  test.skip(!slug, 'The multi-organization fixture is prepared by self-service.ts.');
  if (!slug || !baseURL) throw Error('Public TEST fixture required');
  expect(slug).not.toBe(process.env['PUBLIC_TEST_ORGANIZATION_SLUG']);
  const site = await externalWebsite({ slug }, 'inline', baseURL);
  try {
    await page.goto(site.url);
    const frame = page.frameLocator('iframe');
    const price = await frame.locator('.catalog-price').first().innerText();
    await expect(frame.locator('.catalog-price').first()).toContainText('25,00');
    await frame.getByRole('link', { name: SHARE_UI.CATALOG_OPEN }).first().click();
    await completeEmbeddedBooking(page, BOOKING_UI.PAY);
    await expect(frame.locator('.participant-ticket')).toBeVisible();
    await expect(frame.locator('.ticket-money>div').first()).toContainText(price);
    await expect(frame.getByRole('status').first()).toHaveText(PUBLIC_TEST.PAYMENT_SUCCESS);
    await expect(page).toHaveURL(site.url);
  } finally {
    await site.close();
  }
});
