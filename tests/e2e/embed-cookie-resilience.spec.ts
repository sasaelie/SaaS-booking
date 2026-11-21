import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
import { externalWebsite, completeEmbeddedBooking } from './embed-fixtures';
import { captureEmbeddedView } from './embed-capture';
import {
  denyEmbeddedStorage,
  finishCookieFreeBooking,
  assertPublicEmbedMessages,
} from './embed-resilience-fixtures';
test.afterAll(closeBrowserDatabase);
for (const mode of ['inline', 'floating'] as const) {
  test(`books, saves the ticket, manages and cancels without cookies or storage (${mode})`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    if (!baseURL) throw Error('Base URL required');
    const space = await browserSpace();
    const site = await externalWebsite(space, mode, baseURL);
    await denyEmbeddedStorage(context, baseURL);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(site.url);
      if (mode === 'floating')
        await page.getByRole('button', { name: 'Réserver', exact: true }).click();
      await completeEmbeddedBooking(page);
      await finishCookieFreeBooking(page, space);
      await expect(page).toHaveURL(site.url);
      expect(await context.cookies()).toEqual([]);
      expect(errors).toEqual([]);
      await assertPublicEmbedMessages(page);
      await noHorizontalOverflow(page);
      await captureEmbeddedView(page, info, mode + '-without-storage.png');
    } finally {
      await context.unrouteAll({ behavior: 'wait' });
      await site.close();
    }
  });
}
