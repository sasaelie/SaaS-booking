import { expect, test, type Locator, type Page } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, login } from './portal-fixtures';
test.use({ viewport: { width: 390, height: 900 }, hasTouch: true, isMobile: true });
test.afterAll(closeBrowserDatabase);
test('shows the pressed glass and course illumination with an actual touch pointer', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  const release = await holdSessionNavigation(page);
  try {
    await page.goto(`/app/${space.organizationId}`);
    const counter = page.locator('.portal-metric-link').first();
    await touchPress(page, counter, info.outputPath('counter-pressed-touch.png'));
    await counter.tap();
    await expect(page).toHaveURL(new RegExp(`/activites/${space.activityId}$`));
    await page.goBack();
    const course = page.locator('.portal-session-link');
    await course.tap();
    await expect(course.locator('.planning-link-pending:not([hidden])')).toHaveCount(1);
    const color = await course
      .locator('.planning-event-light')
      .evaluate((e) => getComputedStyle(e).backgroundColor);
    await expect(course).toHaveCSS('border-top-color', color);
    await expect(course).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page
      .locator('.session-planning')
      .screenshot({ path: info.outputPath('course-lit-touch.png') });
    release();
    await expect(page).toHaveURL(/\/seances\//);
    await expect(page.locator('.portal-session-details')).toBeVisible();
  } finally {
    release();
  }
});
async function touchPress(page: Page, counter: Locator, screenshot: string) {
  await counter.scrollIntoViewIfNeeded();
  const box = await counter.boundingBox();
  if (!box) throw Error('Counter must be visible');
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await expect(counter).toHaveCSS('scale', '0.95');
    expect(await counter.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe('none');
    await counter.screenshot({ path: screenshot });
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(counter).toHaveAttribute('data-pointer-pressed', 'false');
    await expect
      .poll(() =>
        counter.evaluate((e) => {
          const scale = getComputedStyle(e).scale;
          return scale === 'none' ? 1 : Number(scale);
        }),
      )
      .toBe(1);
  } finally {
    await client.detach();
  }
}
async function holdSessionNavigation(page: Page) {
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname.includes('/seances/'),
    async (route) => {
      const headers = route.request().headers();
      if (headers['rsc'] === '1') {
        if (headers['next-router-prefetch'] === '1') return route.abort();
        await pending;
      }
      await route.continue();
    },
  );
  return release;
}
