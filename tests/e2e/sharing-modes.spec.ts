import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { externalWebsite, completeEmbeddedBooking, assertEmbedFits } from './embed-fixtures';
import { SHARE_UI, EMBED } from '../../src/config/constants';
test.afterAll(closeBrowserDatabase);
test('copies the public organization link for social networks and keeps member-only access clearly unavailable', async ({
  page,
  context,
  browser,
}) => {
  const space = await browserSpace();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await expect(page.getByRole('tab', { name: SHARE_UI.SOCIAL_MODE })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: SHARE_UI.COPY_LINK }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toBe(new URL(page.url()).origin + '/' + space.slug);
  expect(url).not.toMatch(/embed|bypass|token|secret/i);
  await expect(page.getByRole('link', { name: SHARE_UI.OPEN_PAGE })).toHaveAttribute('href', url);
  await page.getByText(SHARE_UI.MEMBERS, { exact: true }).click();
  await expect(page.getByText(SHARE_UI.MEMBERS_STATUS, { exact: true })).toBeVisible();
  await expect(
    page.locator('.sharing-members input,.sharing-members button,.sharing-members form'),
  ).toHaveCount(0);
  const visitor = await browser.newContext();
  const other = await visitor.newPage();
  try {
    await other.goto(url);
    await other.getByRole('link', { name: SHARE_UI.CATALOG_OPEN }).click();
    await expect(other.getByRole('button', { name: 'Continuer', exact: true })).toBeVisible();
    await expect(other.getByRole('link', { name: /Retour aux activités/ })).toBeVisible();
    await expect(other.getByRole('button', { name: EMBED.RETURN_SITE })).toHaveCount(0);
  } finally {
    await visitor.close();
  }
});
test('switches installation modes, resets copy feedback and runs the complete floating catalog without leaving the host site', async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE }).click();
  await expect(page.getByRole('radio', { name: SHARE_UI.INLINE_CATALOG })).toBeChecked();
  await page.getByRole('button', { name: SHARE_UI.COPY_INSTALL }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('data-mode="inline"');
  await page.getByRole('radio', { name: SHARE_UI.FLOATING_CATALOG }).check();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: SHARE_UI.COPY_INSTALL }).click();
  await assertFloatingCode(page, space.slug);
  const site = await externalWebsite({ slug: space.slug }, 'floating', baseURL);
  try {
    await page.goto(site.url);
    await reserveFromFloatingCatalog(page);
    await expect(page).toHaveURL(site.url);
    const result = await browserDatabase().query(
      'SELECT status FROM bookings WHERE organization_id=$1',
      [space.organizationId],
    );
    expect(result.rows).toEqual([{ status: 'CONFIRMED' }]);
  } finally {
    await site.close();
  }
});
async function assertFloatingCode(page: Page, slug: string) {
  const script = await page.evaluate(() => navigator.clipboard.readText());
  expect(script).toContain(`data-organization="${slug}" data-mode="floating"`);
  expect(script).toContain(`/widget.js?v=${EMBED.CATALOG_VERSION}`);
  expect(script).not.toMatch(/data-activity|bypass|token|secret/i);
}
async function reserveFromFloatingCatalog(page: Page) {
  await page.getByRole('button', { name: SHARE_UI.BUTTON, exact: true }).click();
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText(SHARE_UI.CATALOG_TITLE);
  await assertEmbedFits(page);
  const height = await page
    .locator('iframe')
    .evaluate((element) => getComputedStyle(element).height);
  await frame.getByRole('link', { name: SHARE_UI.CATALOG_OPEN }).click();
  await expect(frame.getByRole('heading', { level: 1 })).toContainText('céramique');
  await completeEmbeddedBooking(page);
  await expect(page.locator('iframe')).toHaveCSS('height', height);
  await expect(page.getByRole('button', { name: SHARE_UI.CLOSE, exact: true })).toBeVisible();
  await frame.getByRole('button', { name: EMBED.RETURN_SITE }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
test('supports keyboard tabs and accessible layouts at four widths while preserving the glass button radius', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  const social = page.getByRole('tab', { name: SHARE_UI.SOCIAL_MODE }),
    website = page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE });
  await social.focus();
  await social.press('ArrowRight');
  await expect(website).toBeFocused();
  await expect(website).toHaveAttribute('aria-selected', 'true');
  await website.press('Home');
  await expect(social).toBeFocused();
  await expect(social).toHaveCSS('border-radius', '8px');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const tab of [social, website]) {
      await tab.click();
      await noHorizontalOverflow(page);
      const audit = await new AxeBuilder({ page }).include('main').analyze();
      expect(
        audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
      ).toEqual([]);
      if (width === 390 || width === 1440) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath(`sharing-${width}-${await tab.textContent()}.png`),
          fullPage: true,
        });
      }
    }
  }
});
test('keeps social links available to Liberty while withholding Pro embed codes and QR downloads', async ({
  page,
}) => {
  const space = await browserSpace();
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=false WHERE organization_id=$1',
    [space.organizationId],
  );
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await expect(page.getByRole('button', { name: SHARE_UI.COPY_LINK })).toBeVisible();
  await expect(page.getByRole('link', { name: SHARE_UI.DOWNLOAD_QR })).toHaveCount(0);
  await page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE }).click();
  await expect(
    page
      .locator(`a[href="/app/${space.organizationId}/abonnement"]`)
      .filter({ hasText: 'Studio Pro' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: SHARE_UI.COPY_INSTALL })).toHaveCount(0);
  await expect(page.locator('.portal-share-code')).toHaveCount(0);
});
