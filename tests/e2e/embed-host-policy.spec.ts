import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase } from './portal-fixtures';
import { externalWebsite } from './embed-fixtures';
import { EMBED_HEALTH as H } from '../../src/config/embed-health';

test.afterAll(closeBrowserDatabase);
test('preserves a public booking link when the host policy refuses frames', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  const site = await externalWebsite(space, 'inline', baseURL, {
    'Content-Security-Policy': "frame-src 'none'",
  });
  await page.clock.install();
  try {
    await page.goto(site.url);
    await expect(page.locator('[data-booking-widget]')).toHaveAttribute(
      'data-booking-state',
      /^(loading|failed)$/,
    );
    await page.clock.fastForward(H.TIMEOUT_MS + 1);
    await expect(page.getByText(H.FAILED, { exact: true })).toBeVisible();
    const link = page.getByRole('link', { name: H.OPEN, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `${baseURL}/${space.slug}/${space.activityId}`);
  } finally {
    await site.close();
  }
});
