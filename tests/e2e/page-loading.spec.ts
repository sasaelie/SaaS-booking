import { expect, test, type Page } from '@playwright/test';
import { browserDatabase, browserSpace, closeBrowserDatabase, login } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('streams the real loading calendar while an initial participant page waits for its data', async ({
  page,
}) => {
  const space = await browserSpace();
  const connection = await browserDatabase().connect();
  try {
    await connection.query('BEGIN');
    await connection.query('LOCK TABLE activities IN ACCESS EXCLUSIVE MODE');
    await page.goto(`/${space.slug}/${space.activityId}`, { waitUntil: 'commit' });
    await expect(page.locator('[data-page-loading]')).toBeVisible();
    await expect(page.locator('[data-page-loading] .page-loading-indicator')).toHaveCSS(
      'opacity',
      '1',
    );
    await connection.query('ROLLBACK');
    await expect(
      page.getByRole('heading', { name: 'Initiation à la céramique', exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-page-loading]')).toHaveCount(0);
  } finally {
    await connection.query('ROLLBACK');
    connection.release();
  }
});
test('shows the same calendar during a slow real internal navigation and removes it when ready', async ({
  page,
}) => {
  const navigation = await holdNavigation(page, '/faq');
  try {
    await page.goto('/');
    await page.locator('.marketing-header').getByRole('link', { name: 'FAQ', exact: true }).click();
    await navigation.started;
    await expect(page.locator('[data-page-loading]')).toBeVisible();
    await expect(page.locator('[data-page-loading] .page-loading-indicator')).toHaveCSS(
      'opacity',
      '1',
    );
    navigation.release();
    await expect(page).toHaveURL('/faq');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-page-loading]')).toHaveCount(0);
  } finally {
    navigation.release();
  }
});
test('keeps organizer navigation available while only the requested content is loading', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  const path = `/app/${space.organizationId}/activites`;
  const navigation = await holdNavigation(page, path);
  try {
    await page.goto(`/app/${space.organizationId}`);
    await page.locator(`.portal-nav-links a[href="${path}"]`).click();
    await navigation.started;
    await expect(page.locator('[data-page-loading]:visible')).toBeVisible();
    await expect(page.locator('.portal-sidebar')).toBeVisible();
    await expect(page.locator('.portal-nav')).toBeVisible();
    navigation.release();
    await expect(page).toHaveURL(path);
    await expect(page.locator('[data-page-loading]')).toHaveCount(0);
  } finally {
    navigation.release();
  }
});
test('does not show a page loader for a same-page anchor', async ({ page }) => {
  await page.goto('/');
  await page
    .locator('.marketing-header')
    .getByRole('link', { name: 'Tarifs', exact: true })
    .click();
  await expect(page).toHaveURL(/#tarifs$/);
  await expect(page.locator('[data-page-loading]')).toHaveCount(0);
});
test('keeps the same indicator until streamed participant data is ready after navigation starts', async ({
  page,
}) => {
  const space = await browserSpace();
  const path = `/${space.slug}/${space.activityId}`;
  await page.route(
    (url) => url.pathname === path,
    (route) =>
      route.request().headers()['next-router-prefetch'] === '1' ? route.abort() : route.continue(),
  );
  await page.goto(`/${space.slug}`);
  const connection = await browserDatabase().connect();
  try {
    await connection.query('BEGIN');
    await connection.query('LOCK TABLE activities IN ACCESS EXCLUSIVE MODE');
    await page.locator(`a[href="${path}"]`).first().click();
    await expect(page.locator('.page-loading-screen')).toBeAttached();
    await expect(page.locator('.page-navigation-loading')).toHaveCSS('opacity', '1');
    await expect(page.locator('.page-loading-screen')).not.toBeVisible();
    await connection.query('ROLLBACK');
    await expect(
      page.getByRole('heading', { name: 'Initiation à la céramique', exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-page-loading]')).toHaveCount(0);
  } finally {
    await connection.query('ROLLBACK');
    connection.release();
  }
});
async function holdNavigation(page: Page, path: string) {
  let release = () => {};
  let began = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    began = resolve;
  });
  await page.route(
    (url) => url.pathname === path,
    async (route) => {
      const headers = route.request().headers();
      if (headers['rsc'] === '1') {
        if (headers['next-router-prefetch'] === '1') return route.abort();
        began();
        await pending;
      }
      await route.continue();
    },
  );
  return { release, started };
}
