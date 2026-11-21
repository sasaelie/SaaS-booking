import { expect, type Page, type TestInfo } from '@playwright/test';

export async function captureEmbeddedView(page: Page, info: TestInfo, filename: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.frameLocator('iframe').locator('[data-page-loading]').waitFor({ state: 'hidden' });
  if (await page.frameLocator('iframe').locator('.ice-result').count())
    await expect(page.frameLocator('iframe').locator('.participant-ticket')).toBeVisible();
  await page
    .frameLocator('iframe')
    .locator('body')
    .evaluate(async () => {
      await document.fonts.ready;
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
  await page.screenshot({ path: info.outputPath(filename), animations: 'disabled' });
}
