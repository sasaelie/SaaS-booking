import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('shows the animated calendar, finishes its exit, and lets the visitor replay without server writes', async ({
  page,
}) => {
  let writes = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') writes++;
  });
  await page.goto('/apercu-chargement');
  await expect(page.getByRole('heading', { name: 'Aperçu du chargement' })).toBeVisible();
  await expect(page.locator('.page-loading-indicator')).toHaveCSS('opacity', '1');
  await expect(page.locator('#loading-preview-stage')).toHaveAttribute('data-loading', 'true');
  await page.getByRole('button', { name: 'Terminer le chargement' }).click();
  await expect(page.getByRole('heading', { name: 'La page est prête' })).toBeVisible();
  await expect(page.locator('.page-loading-indicator')).toHaveCount(0);
  await expect(page.locator('#loading-preview-stage')).toHaveAttribute('data-loading', 'false');
  await page.getByRole('button', { name: 'Revoir l’animation' }).click();
  await expect(page.locator('.page-loading-indicator')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Terminer le chargement' })).toBeEnabled();
  expect(writes).toBe(0);
});
test('keeps the preview accessible at mobile and desktop widths and honors reduced motion', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/apercu-chargement');
    await expect(page.locator('.page-loading-dots > span').first()).toHaveCSS(
      'animation-name',
      'none',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    if (width === 390) {
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) })),
      ).toEqual([]);
      await page.screenshot({ path: info.outputPath('calendar-mobile.png') });
    }
    const finish = page.getByRole('button', { name: 'Terminer le chargement' });
    await finish.focus();
    await finish.press('Enter');
    await expect(page.getByRole('heading', { name: 'La page est prête' })).toBeVisible();
    const replay = page.getByRole('button', { name: 'Revoir l’animation' });
    await replay.focus();
    await replay.press('Enter');
    await expect(page.locator('.page-loading-indicator')).toBeVisible();
  }
});
test('does not flash the indicator if completion happens before its delayed entrance', async ({
  page,
}) => {
  await page.goto('/apercu-chargement');
  await page.addStyleTag({
    content: '.page-loading-indicator { animation-play-state: paused !important; }',
  });
  await page.locator('.page-loading-indicator').evaluate((element) => {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
  });
  await expect(page.locator('.page-loading-indicator')).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: 'Terminer le chargement' }).click();
  await expect(page.getByRole('heading', { name: 'La page est prête' })).toBeVisible();
  await expect(page.locator('.page-loading-indicator')).toHaveCount(0);
});
