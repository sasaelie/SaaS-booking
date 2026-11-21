import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase } from './portal-fixtures';
import { externalWebsite } from './embed-fixtures';
import { captureEmbeddedView } from './embed-capture';
import { EMBED_HEALTH as H } from '../../src/config/embed-health';
test.afterAll(closeBrowserDatabase);
test('retains an independent public link if the installation script is blocked', async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'inline', baseURL);
  await page.route('**/widget.js*', (route) => route.abort('blockedbyclient'));
  try {
    await page.goto(site.url);
    await expect(page.locator('iframe')).toHaveCount(0);
    const link = page.getByRole('link', { name: H.OPEN, exact: true });
    await expect(link).toHaveAttribute('href', `${baseURL}/${space.slug}/${space.activityId}`);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const opened = context.waitForEvent('page');
    await link.click();
    const other = await opened;
    await other.waitForLoadState();
    expect(await other.evaluate(() => window.opener === null)).toBe(true);
    await expect(other.getByRole('button', { name: 'Continuer', exact: true })).toBeVisible();
    await other.close();
  } finally {
    await site.close();
  }
});
test('shows the real installation result on the organizer website only in explicit diagnostic mode', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'inline', baseURL);
  try {
    await page.goto(site.url + '/?' + H.DIAGNOSTIC_PARAM + '=' + space.slug);
    await expect(page.getByText(H.READY_NOTE, { exact: true })).toBeVisible();
    await expect(
      page.frameLocator('iframe').getByRole('button', { name: 'Continuer', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: H.OPEN, exact: true })).toBeHidden();
    await captureEmbeddedView(page, info, 'installation-confirmed.png');
  } finally {
    await site.close();
  }
});
test('keeps a direct accessible booking action when native dialogs are unavailable', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'floating', baseURL);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined });
  });
  try {
    await page.goto(site.url);
    const link = page.getByRole('link', { name: 'Réserver', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `${baseURL}/${space.slug}/${space.activityId}`);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(page.locator('iframe')).toHaveCount(0);
  } finally {
    await site.close();
  }
});
