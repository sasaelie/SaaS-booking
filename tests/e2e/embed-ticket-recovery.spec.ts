import { expect, test } from '@playwright/test';
import { browserSpace, browserDatabase, closeBrowserDatabase } from './portal-fixtures';
import { externalWebsite, completeEmbeddedBooking, saveEmbeddedTicket } from './embed-fixtures';
import { FORM_LABELS } from '../../src/config/constants';
test.afterAll(closeBrowserDatabase);
test('recovers a confirmed ticket after a temporary context failure without creating a second booking', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'inline', baseURL);
  let unavailable = true;
  await page.route('**/api/self-service/context', (route) =>
    unavailable
      ? route.fulfill({ status: 503, json: { error: 'temporarily unavailable' } })
      : route.continue(),
  );
  try {
    await page.goto(site.url);
    await completeEmbeddedBooking(page);
    const frame = page.frameLocator('iframe');
    await expect(
      frame.getByRole('alert').filter({ hasText: FORM_LABELS.CONTEXT_UNAVAILABLE }),
    ).toBeVisible();
    unavailable = false;
    await frame.getByRole('button', { name: FORM_LABELS.RETRY, exact: true }).click();
    await saveEmbeddedTicket(page);
    await expect(frame.locator('.participant-ticket')).toBeVisible();
    const rows = await browserDatabase().query(
      'SELECT status FROM bookings WHERE organization_id=$1',
      [space.organizationId],
    );
    expect(rows.rows).toEqual([{ status: 'CONFIRMED' }]);
  } finally {
    await site.close();
  }
});
