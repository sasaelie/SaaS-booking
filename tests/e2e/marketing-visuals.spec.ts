import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './portal-fixtures';
test('reveals useful details on hover and lets keyboard users open and dismiss them', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('.marketing-feature-tile');
  const first = cards.first().getByRole('button');
  await first.hover();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(cards.first()).toContainText('Chaque participant choisit sa séance');
  await page.mouse.move(0, 0);
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await first.focus();
  await first.press('Enter');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await first.hover();
  await page.mouse.move(0, 0);
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await first.press('Escape');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await first.press('Tab');
  const next = cards.nth(1).getByRole('button');
  await expect(next).toBeFocused();
  await next.press('Space');
  await expect(next).toHaveAttribute('aria-expanded', 'true');
  await next.press('Space');
  await expect(next).toHaveAttribute('aria-expanded', 'false');
});
test('opens a card on the first touch and keeps the explanation in its own frame', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const cards = page.locator('.marketing-feature-tile');
    const first = cards.first().getByRole('button');
    await first.tap();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    const detail = cards.first().locator('.marketing-feature-detail');
    await expect(detail).toBeVisible();
    const bounds = await detail.boundingBox();
    const following = await cards.nth(1).boundingBox();
    expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThan(following?.y ?? 0);
    await first.tap();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await cards.nth(2).getByRole('button').tap();
    await expect(cards.nth(2).locator('.marketing-feature-detail')).toContainText(
      'vérifiez les paiements reçus',
    );
    await noHorizontalOverflow(page);
  } finally {
    await context.close();
  }
});
test('keeps linked images and expanded cards within the viewport without new writes', async ({
  page,
}, info) => {
  let writes = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') writes++;
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await checkExamplePhotos(page);
    await expect(page.locator('.marketing-calendar-preview')).toContainText('données fictives');
    for (const button of await page.locator('.marketing-feature-trigger').all()) {
      await button.focus();
      await button.press('Enter');
      await noHorizontalOverflow(page);
      await button.press('Escape');
    }
    if ([390, 1440].includes(width))
      await page.screenshot({ path: info.outputPath(`visuels-${width}.png`), fullPage: true });
  }
  expect(writes).toBe(0);
});
async function checkExamplePhotos(page: Page) {
  for (const label of ['Ateliers', 'Soins', 'Sport']) {
    await page.getByRole('radio', { name: label, exact: true }).focus();
    await page
      .getByRole('group', { name: 'Explorer un exemple d’activité' })
      .getByRole('radio', { name: label, exact: true })
      .check();
    const image = page.locator('.marketing-story-photo img');
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element) =>
            element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await noHorizontalOverflow(page);
  }
}
test('keeps expanded explanations accessible and honors reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const button of await page.locator('.marketing-feature-trigger').all()) {
    await button.focus();
    await button.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map(({ target }) => target),
      })),
    ).toEqual([]);
    await expect(button.locator('.marketing-tile-icon')).toHaveCSS('transform', 'none');
    await expect(button).toHaveCSS('transition-duration', '0s');
    await button.press('Escape');
  }
});
