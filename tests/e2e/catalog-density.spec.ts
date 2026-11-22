import { expect, test, type Page, type Locator } from '@playwright/test';
import { densitySpace, catalogPlacement } from './catalog-density-fixtures';
import { browserDatabase, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
import { externalWebsite, assertEmbedFits } from './embed-fixtures';
test.afterAll(closeBrowserDatabase);
for (const count of [1, 2, 4, 8]) {
  test(`adapts ${count} published courses while preserving prices, titles, photos and accessible actions`, async ({
    page,
  }, info) => {
    const space = await densitySpace(count);
    await page.goto(`/${space.slug}`);
    await expect(page.locator('.catalog-activity')).toHaveCount(count);
    await expect(page.locator('.catalog-grid')).toHaveAttribute(
      'data-density',
      count === 1 ? 'poster' : 'compact',
    );
    await expect(page.locator('.catalog-activity .story-canvas')).toHaveCount(count === 1 ? 1 : 0);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await checkColumns(page, count, width);
      await checkCourseContent(page, space.activities, count > 1);
      await noHorizontalOverflow(page);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: info.outputPath(`catalog-${count}-${width}.png`),
          fullPage: true,
        });
    }
  });
}
test('counts only visible courses and preserves saved free placement on the single card and full activity', async ({
  page,
}) => {
  const space = await densitySpace(2);
  const other = space.activities[1];
  if (!other) throw Error('Second course required');
  await browserDatabase().query('UPDATE activities SET is_active=false WHERE id=$1', [other.id]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${space.slug}`);
  await expect(page.locator('.catalog-activity')).toHaveCount(1);
  await expect(page.locator('.catalog-grid')).toHaveAttribute('data-density', 'poster');
  const largeHeight = await page
    .locator('.catalog-activity')
    .evaluate((e) => e.getBoundingClientRect().height);
  await expect(page.locator('.story-positioned-title')).toHaveAttribute(
    'style',
    /left:18%|left: 18%/,
  );
  await browserDatabase().query('UPDATE activities SET is_active=true WHERE id=$1', [other.id]);
  await page.reload();
  await expect(page.locator('.catalog-activity')).toHaveCount(2);
  const smallHeight = await page
    .locator('.catalog-activity')
    .first()
    .evaluate((e) => e.getBoundingClientRect().height);
  expect(smallHeight).toBeLessThan(largeHeight - 80);
  await page
    .locator('.catalog-activity')
    .first()
    .getByRole('link', { name: 'Choisir une séance' })
    .click();
  await expect(page.locator('.ice-story .story-canvas')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.ice-story .story-positioned-price')).toHaveAttribute(
    'style',
    /left:78%|left: 78%/,
  );
  await assertStoredPlacement(space.organizationId);
});
test('keeps an eight-course embed in one compact column inside a narrow area of a desktop website', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Booking application URL required');
  const space = await densitySpace(8, false);
  const site = await externalWebsite({ slug: space.slug }, 'inline', baseURL);
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(site.url);
    await page.locator('[data-booking-widget]').evaluate((e) => {
      e.style.maxWidth = '420px';
      e.style.marginInline = 'auto';
    });
    await assertEmbedFits(page);
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('.catalog-activity')).toHaveCount(8);
    await expect(frame.locator('.catalog-grid')).toHaveCSS('grid-template-columns', /^\S+$/);
    await expect(frame.locator('.story-canvas')).toHaveCount(0);
    const chosenName = await frame.locator('.catalog-activity h2').first().innerText();
    await frame
      .locator('.catalog-activity')
      .first()
      .getByRole('link', { name: 'Choisir une séance' })
      .click();
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(chosenName);
    await assertEmbedFits(page);
    await expect(page).toHaveURL(site.url);
  } finally {
    await site.close();
  }
});
async function checkColumns(page: Page, count: number, width: number) {
  const columns = count === 1 || width < 768 ? 1 : width === 1440 && count >= 5 ? 3 : 2;
  await expect
    .poll(() =>
      page.locator('.catalog-grid').evaluate(
        (e) =>
          getComputedStyle(e)
            .gridTemplateColumns.split(/\s+/)
            .filter((track) => parseFloat(track) > 0).length,
      ),
    )
    .toBe(columns);
}
async function checkCourseContent(
  page: Page,
  activities: Awaited<ReturnType<typeof densitySpace>>['activities'],
  compact: boolean,
) {
  for (const activity of activities) {
    const card = page
      .locator('.catalog-activity')
      .filter({ has: page.getByRole('heading', { name: activity.name, exact: true }) });
    await expect(card.locator('h2')).toHaveText(activity.name);
    await expect(
      card.locator(compact ? '.catalog-price' : '.story-positioned-price'),
    ).toContainText(activity.price);
    await expect(card.locator('img')).toBeVisible();
    await expect
      .poll(() =>
        card
          .locator('img')
          .evaluate((e) => e instanceof HTMLImageElement && e.complete && e.naturalWidth > 0),
      )
      .toBe(true);
    if (compact) await assertReadableCard(card);
  }
}
async function assertReadableCard(card: Locator) {
  const action = card.getByRole('link', { name: 'Choisir une séance' });
  const [bounds, title, price, button] = await Promise.all([
    card.boundingBox(),
    card.locator('h2').boundingBox(),
    card.locator('.catalog-price').boundingBox(),
    action.boundingBox(),
  ]);
  if (!bounds || !title || !price || !button) throw Error('Visible course fields required');
  expect(bounds.height).toBeLessThan(440);
  expect(title.y + title.height).toBeLessThan(price.y);
  expect(button.height).toBeGreaterThanOrEqual(44);
  expect(button.x + button.width).toBeLessThanOrEqual(bounds.x + bounds.width);
  expect(button.y + button.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  await expect(action).toHaveCSS('border-radius', '8px');
}

async function assertStoredPlacement(organizationId: string) {
  const stored = await browserDatabase().query(
    'SELECT story_layout FROM organization_branding WHERE organization_id=$1',
    [organizationId],
  );
  expect(stored.rows[0].story_layout).toEqual(catalogPlacement);
}
