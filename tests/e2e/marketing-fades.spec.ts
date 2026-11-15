import { expect, test, type Page } from '@playwright/test';
import { MARKETING_DEMO as DEMO } from '../../src/config/marketing-demo';
import { advanceDemoPhase, finishDemoFade, holdDemoAnimations } from './marketing-demo-clock';
test('fades the old example out before changing photo and calendar, then fades the new example in', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.locator('.marketing-preview-wrap').scrollIntoViewIfNeeded();
  await page.clock.runFor(100);
  for (const phase of ['draft', 'published', 'selected'] as const)
    await advanceDemoPhase(page, phase);
  await page.clock.runFor(DEMO.STEPS[3].delayMs - DEMO.FADE_IN_MS - DEMO.FADE_OUT_MS + 50);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-transition', 'out');
  await expect(
    page.getByRole('heading', { name: 'Une parenthèse céramique', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.marketing-calendar-preview')).toHaveAttribute('data-phase', 'booked');
  const outgoing = await fadeOpacity(page, DEMO.FADE_OUT_MS / 2);
  expect(outgoing).toHaveLength(4);
  for (const value of outgoing) {
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(1);
  }
  await page.clock.runFor(DEMO.FADE_OUT_MS * 4);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-phase', 'booked');
  await finishDemoFade(page);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-transition', 'in');
  await expect(
    page.getByRole('heading', { name: 'Votre moment de soin', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.marketing-calendar-preview')).toHaveAttribute('data-phase', 'draft');
  for (const value of await fadeOpacity(page, 0)) expect(value).toBe(0);
  await expect(page.locator('.marketing-preview-photo')).toHaveAttribute('src', /soins/);
  for (const value of await fadeOpacity(page, DEMO.FADE_IN_MS / 2)) {
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(1);
  }
  await finishDemoFade(page);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-transition', 'idle');
  await expectFullVisibility(page);
});
test('restores full visibility when paused during an exit and disables fades for reduced motion', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await holdDemoAnimations(page);
  const preview = page.locator('.marketing-preview-wrap');
  await preview.scrollIntoViewIfNeeded();
  await page.clock.runFor(100);
  await page.clock.runFor(DEMO.STEPS[0].delayMs - DEMO.FADE_OUT_MS - DEMO.FADE_IN_MS + 50);
  await expect(preview).toHaveAttribute('data-transition', 'out');
  await preview.getByRole('button', { name: 'Mettre en pause', exact: true }).click();
  await expect(preview).toHaveAttribute('data-transition', 'idle');
  await page.clock.runFor(20000);
  await expect(preview).toHaveAttribute('data-phase', 'draft');
  await expectFullVisibility(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await preview.getByRole('button', { name: 'Reprendre la démonstration', exact: true }).click();
  await page.clock.runFor(DEMO.STEPS[0].delayMs + 50);
  await expect(preview).toHaveAttribute('data-phase', 'published');
  await expect(preview).toHaveAttribute('data-transition', 'idle');
  for (const element of await page.locator('.marketing-demo-fade').all()) {
    await expect(element).toHaveCSS('animation-name', 'none');
    await expect(element).toHaveCSS('opacity', '1');
  }
});
async function fadeOpacity(page: Page, time: number) {
  return page.locator('.marketing-demo-fade').evaluateAll(
    (elements, position) =>
      elements.map((element) => {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = position;
        }
        return Number(getComputedStyle(element).opacity);
      }),
    time,
  );
}

async function expectFullVisibility(page: Page) {
  const values = await page
    .locator('.marketing-demo-fade')
    .evaluateAll((es) => es.map((e) => Number(getComputedStyle(e).opacity)));
  for (const value of values) expect(value).toBe(1);
}
