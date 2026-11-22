import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, login, noHorizontalOverflow } from './portal-fixtures';
import { EMBED_HEALTH as H } from '../../src/config/embed-health';
import { SHARE_UI } from '../../src/config/constants';
test.afterAll(closeBrowserDatabase);
test('distinguishes private-session reachability from a confirmed installation on the host page', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE }).click();
  await page.getByText(H.HELP_TITLE, { exact: true }).click();
  await expect(page.getByText(H.CHECK_PRIVATE, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: H.CHECK, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(H.CHECK_PRIVATE_READY);
  await expect(page.locator('.sharing-embed-check .status-badge')).toHaveAttribute(
    'data-tone',
    'orange',
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    if (width === 390)
      await page.screenshot({
        path: info.outputPath('organizer-installation-check.png'),
        fullPage: true,
      });
  }
});
test('opens a site check without exposing the organizer window or changing the page address', async ({
  page,
  context,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE }).click();
  await page.getByText(H.HELP_TITLE, { exact: true }).click();
  await page.getByRole('textbox', { name: H.SITE_LABEL }).fill('http://untrusted.example');
  await page.getByRole('button', { name: H.SITE_OPEN, exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: H.SITE_INVALID })).toBeVisible();
  await context.route('https://organizer.example/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Organizer page</title>',
    }),
  );
  await page
    .getByRole('textbox', { name: H.SITE_LABEL })
    .fill('https://organizer.example/ateliers?lang=fr#programme');
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: H.SITE_OPEN, exact: true }).click();
  const site = await opened;
  await site.waitForLoadState();
  const target = new URL(site.url());
  expect(target.searchParams.get(H.DIAGNOSTIC_PARAM)).toBe(space.slug);
  expect(target.searchParams.get('lang')).toBe('fr');
  expect(target.hash).toBe('#programme');
  expect(await site.evaluate(() => window.opener === null)).toBe(true);
  await expect(page).toHaveURL(`/app/${space.organizationId}/partager`);
  await site.close();
});
