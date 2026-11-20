import { expect, test } from '@playwright/test';
import { browserSpace, browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('renders a stored markup payload as text and never publishes internal connection fields', async ({
  page,
  browser,
}) => {
  await login(page, await browserSpace());
  const headers = { Origin: new URL(page.url()).origin };
  const current =
    (await browserDatabase().query('SELECT revision FROM platform_settings WHERE id=1')).rows[0]
      ?.revision ?? 0;
  const name = '<img src=x onerror="window.profileAttack=true">';
  const saved = await page.request.post('/api/plateforme/settings', {
    headers,
    data: {
      action: 'save',
      revision: current,
      profile: { name, email: 'security@example.invalid' },
    },
  });
  expect(saved.ok()).toBe(true);
  const published = await page.request.post('/api/plateforme/settings', {
    headers,
    data: { action: 'publish', revision: current + 1 },
  });
  expect(published.ok()).toBe(true);
  const visitor = await browser.newPage({ baseURL: new URL(page.url()).origin });
  try {
    await visitor.goto('/contact');
    await expect(visitor.locator('main .platform-public-contact')).toContainText(name);
    await expect(visitor.locator('main .platform-public-contact img')).toHaveCount(0);
    expect(await visitor.evaluate(() => Reflect.get(window, 'profileAttack'))).toBeUndefined();
    await expect(visitor.locator('main')).not.toContainText('0208:0123456789');
    expect((await visitor.request.get('/api/plateforme/settings')).status()).toBe(405);
  } finally {
    await page.request.post('/api/plateforme/settings', {
      headers,
      data: { action: 'unpublish', revision: current + 2 },
    });
    await visitor.close();
  }
});
