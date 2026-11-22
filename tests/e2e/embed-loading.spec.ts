import { expect, test, type Page } from '@playwright/test';
import { browserSpace, browserDatabase, closeBrowserDatabase } from './portal-fixtures';
import { externalWebsite } from './embed-fixtures';
import { EMBED_HEALTH as H } from '../../src/config/embed-health';
test.afterAll(closeBrowserDatabase);
test('waits for a real frame reply, rejects forged messages and allows a controlled retry', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'inline', baseURL);
  let blocked = true;
  await page.route(`${baseURL}/embed/**`, (route) =>
    blocked
      ? route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><title>No application reply</title>',
        })
      : route.continue(),
  );
  await page.clock.install();
  try {
    await page.goto(site.url);
    const root = page.locator('[data-booking-widget]');
    await expect(root).toHaveAttribute('data-booking-state', 'loading');
    await forgeReady(page, baseURL);
    await expect(root).not.toHaveAttribute('data-booking-state', 'ready');
    await page.clock.fastForward(H.SLOW_MS);
    await expect(page.getByText(H.SLOW, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: H.OPEN, exact: true })).toBeVisible();
    await page.clock.fastForward(H.TIMEOUT_MS - H.SLOW_MS + 1);
    await expect(page.getByText(H.FAILED, { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('connection-unavailable.png'), fullPage: true });
    blocked = false;
    await page.getByRole('button', { name: H.RETRY, exact: true }).click();
    await expect(root).toHaveAttribute('data-booking-state', 'ready');
    await expect(
      page.frameLocator('iframe').getByRole('button', { name: 'Continuer', exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-booking-status]')).toBeHidden();
  } finally {
    await site.close();
  }
});
async function forgeReady(page: Page, baseURL: string) {
  await page.evaluate(
    ({ origin, data }) =>
      window.dispatchEvent(new MessageEvent('message', { origin, source: window, data })),
    {
      origin: new URL(baseURL).origin,
      data: { type: H.READY, version: H.VERSION, status: 'ready' },
    },
  );
}
test('preserves an entered booking after the initial connection watchdog expires', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'inline', baseURL);
  await page.clock.install();
  try {
    await page.goto(site.url);
    await expect(page.locator('[data-booking-widget]')).toHaveAttribute(
      'data-booking-state',
      'ready',
    );
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: 'Continuer', exact: true }).click();
    const name = frame.getByRole('textbox', { name: 'Prénom', exact: true });
    await name.fill('Saisie à conserver');
    await page.clock.fastForward(H.TIMEOUT_MS * 2);
    await expect(name).toHaveValue('Saisie à conserver');
    await expect(page.locator('[data-booking-status]')).toBeHidden();
  } finally {
    await site.close();
  }
});
test('reports an unavailable calendar and recovers only after access is actually restored', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace(),
    site = await externalWebsite(space, 'inline', baseURL);
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=false WHERE organization_id=$1',
    [space.organizationId],
  );
  try {
    await page.goto(site.url);
    await expect(page.locator('[data-booking-widget]')).toHaveAttribute(
      'data-booking-state',
      'unavailable',
    );
    await expect(page.getByText(H.UNAVAILABLE, { exact: true })).toBeVisible();
    await browserDatabase().query(
      'UPDATE organization_access SET complimentary=true WHERE organization_id=$1',
      [space.organizationId],
    );
    await page.getByRole('button', { name: H.RETRY, exact: true }).click();
    await expect(page.locator('[data-booking-widget]')).toHaveAttribute(
      'data-booking-state',
      'ready',
    );
  } finally {
    await site.close();
  }
});
