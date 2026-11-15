import { expect, test } from '@playwright/test';
import { MARKETING_PREVIEW as UI } from '../../src/config/marketing-preview';
import { MARKETING_DEMO as DEMO } from '../../src/config/marketing-demo';
import { advanceDemoPhase as advance } from './marketing-demo-clock';
test('runs creation, publication, client selection and booking on its own without a Play click or server writes', async ({
  page,
}) => {
  let writes = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') writes++;
  });
  await page.clock.install();
  await page.goto('/');
  await page.locator('.marketing-preview-wrap').scrollIntoViewIfNeeded();
  await page.clock.runFor(100);
  const calendar = page.locator('.marketing-calendar-preview');
  for (const example of UI.EXAMPLES) {
    await expect(page.getByRole('heading', { name: example.title, exact: true })).toBeVisible();
    for (const scene of DEMO.STEPS) {
      await expect(calendar).toHaveAttribute('data-phase', scene.key);
      if (scene.key === 'draft') await expect(calendar.locator('dl')).toContainText(example.title);
      if (scene.key === 'selected')
        await expect(page.getByRole('radio', { name: example.sessions[1].label })).toBeChecked();
      if (scene.key === 'booked') {
        await expect(calendar).toContainText(UI.SIMULATED);
        await expect(calendar).toContainText(
          `${example.sessions[1].label} – ${example.sessions[1].end}`,
        );
        await expect(page.locator('.marketing-preview-availability')).toContainText(
          String(example.capacity - 1),
        );
      }
      await advance(page, scene.key);
    }
  }
  await expect(page.getByRole('radio', { name: 'Ateliers', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: UI.PLAY, exact: true })).toHaveCount(0);
  expect(writes).toBe(0);
});
test('links a manual selection and booking while preserving an explicit pause', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('radio', { name: UI.EXAMPLES[0].sessions[0].label })).toBeVisible();
  await page
    .locator('.marketing-preview-wrap')
    .getByRole('button', { name: UI.PAUSE, exact: true })
    .click();
  const calendar = page.locator('.marketing-calendar-preview');
  for (const example of UI.EXAMPLES) {
    await page.getByRole('radio', { name: example.label, exact: true }).check();
    const session = example.sessions[1];
    await page.getByRole('radio', { name: session.label, exact: true }).check();
    await expect(calendar).toContainText(example.title);
    await expect(calendar).toContainText(session.fullDate);
    await expect(calendar).toContainText(`${session.label} – ${session.end}`);
    await expect(calendar.locator('[data-active="true"]')).toHaveText(session.date);
    await expect(page.locator('.marketing-story-photo img')).toHaveAttribute(
      'src',
      new RegExp(encodeURIComponent(example.image)),
    );
    await page.getByRole('button', { name: UI.SIMULATE, exact: true }).click();
    await expect(calendar).toHaveAttribute('data-booked', 'true');
    await expect(calendar).toBeFocused();
    await expect(calendar).toBeInViewport();
    await expect(
      page.locator('.marketing-story-demo').getByRole('button', { name: UI.PLAY, exact: true }),
    ).toBeVisible();
  }
});
test('keeps an intentional Pause until the visitor resumes it', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const preview = page.locator('.marketing-preview-wrap');
  await preview.getByRole('button', { name: UI.PAUSE, exact: true }).click();
  await page.clock.runFor(30000);
  await expect(preview).toHaveAttribute('data-phase', 'draft');
  await preview.getByRole('button', { name: UI.PLAY, exact: true }).click();
  await advance(page, 'draft');
  await expect(preview).toHaveAttribute('data-phase', 'published');
});
test('temporarily holds keyboard controls and restarts on blur without requiring Play', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('radio', { name: 'Ateliers', exact: true }).focus();
  await page.clock.runFor(20000);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-phase', 'draft');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Soins', exact: true })).toBeChecked();
  await page.clock.runFor(20000);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-phase', 'published');
  await page.getByRole('banner').getByRole('link', { name: 'FAQ', exact: true }).focus();
  await page.locator('.marketing-preview-wrap').scrollIntoViewIfNeeded();
  await page.clock.runFor(100);
  await advance(page, 'published');
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-phase', 'selected');
  await expect(page.getByRole('button', { name: UI.PLAY, exact: true })).toHaveCount(0);
});
test('continues after a touch on the calendar and restarts from offscreen with reduced motion', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.clock.install();
    await page.goto('/');
    const calendar = page.locator('.marketing-calendar-preview');
    await calendar.scrollIntoViewIfNeeded();
    await page.clock.runFor(100);
    await calendar.locator('h3').tap();
    await expect(calendar.locator('dd').first()).toHaveCSS('animation-name', 'none');
    await advance(page, 'draft');
    await expect(calendar).toHaveAttribute('data-phase', 'published');
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    await expect(page.locator('.marketing-story-demo')).toHaveAttribute('data-running', 'false');
    await page.clock.runFor(20000);
    await expect(calendar).toHaveAttribute('data-phase', 'published');
    await calendar.scrollIntoViewIfNeeded();
    await expect(page.locator('.marketing-story-demo')).toHaveAttribute('data-running', 'true');
    await advance(page, 'published');
    await expect(calendar).toHaveAttribute('data-phase', 'selected');
    await expect(page.getByRole('button', { name: UI.PLAY, exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
