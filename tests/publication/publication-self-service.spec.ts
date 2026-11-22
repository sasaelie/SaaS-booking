import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from '../e2e/portal-fixtures';
import { SHARE_UI } from '../../src/config/constants';
test.afterAll(closeBrowserDatabase);
test('requires activation then supplies the organization’s public code without private URLs', async ({
  page,
  context,
}, info) => {
  if (!process.env['PUBLIC_BOOKING_URL'])
    throw Error('Public TEST publication infrastructure is required.');
  const space = await browserSpace();
  await page.request.get('/app');
  await page.request.get('/api/portal/command');
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await expect(page.getByRole('button', { name: SHARE_UI.COPY_LINK })).toHaveCount(0);
  await expect(page.getByRole('button', { name: SHARE_UI.COPY_INSTALL })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath('test-activation-mobile.png'), fullPage: true });
  await activate(page, space.organizationId);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: SHARE_UI.COPY_LINK }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `${process.env['PUBLIC_BOOKING_URL']}/${space.slug}`,
  );
  await page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE }).click();
  await page.getByRole('button', { name: SHARE_UI.COPY_INSTALL }).click();
  await assertPublicCode(page, space.slug);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noHorizontalOverflow(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath('public-sharing-mobile.png'), fullPage: true });
});

async function assertPublicCode(page: import('@playwright/test').Page, slug: string) {
  const code = await page.evaluate(() => navigator.clipboard.readText());
  expect(code).toContain(`${process.env['PUBLIC_BOOKING_URL']}/widget.js`);
  expect(code).toContain(`data-organization="${slug}"`);
  expect(code).not.toContain('127.0.0.1:3012');
}

async function activate(page: import('@playwright/test').Page, organizationId: string) {
  const publish = page.getByRole('button', { name: SHARE_UI.TEST_ACTIVATE, exact: true });
  await publish.click();
  const before = await browserDatabase().query(
    'SELECT organization_id FROM booking_public_test.publication WHERE organization_id=$1',
    [organizationId],
  );
  expect(before.rowCount).toBe(0);
  await page.getByRole('checkbox', { name: SHARE_UI.TEST_ACKNOWLEDGE }).check();
  await publish.click();
  await expect(page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE })).toBeVisible({
    timeout: 15000,
  });
}
