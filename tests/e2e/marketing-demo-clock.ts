import { expect, type Page } from '@playwright/test';
import { MARKETING_DEMO as DEMO, type DemoPhase } from '../../src/config/marketing-demo';
export async function advanceDemoPhase(page: Page, phase: DemoPhase) {
  const scene = DEMO.STEPS.find((step) => step.key === phase);
  expect(scene).toBeDefined();
  const region = page.locator('.marketing-preview-wrap');
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduced) {
    await page.clock.runFor((scene?.delayMs ?? 0) + 100);
    await expect(region).not.toHaveAttribute('data-phase', phase);
    await expect(region).toHaveAttribute('data-transition', 'idle');
    return;
  }
  await holdDemoAnimations(page);
  await page.clock.runFor((scene?.delayMs ?? 0) - DEMO.FADE_OUT_MS - DEMO.FADE_IN_MS + 100);
  await expect(region).toHaveAttribute('data-transition', 'out');
  await finishDemoFade(page);
  await expect(region).toHaveAttribute('data-transition', 'in');
  await finishDemoFade(page);
  await expect(region).toHaveAttribute('data-transition', 'idle');
}
export async function holdDemoAnimations(page: Page) {
  await page.evaluate(() => {
    if (document.getElementById('qa-hold-demo-animation')) return;
    const style = document.createElement('style');
    style.id = 'qa-hold-demo-animation';
    style.textContent = '.marketing-demo-fade { animation-play-state: paused !important; }';
    document.head.append(style);
  });
}
export async function finishDemoFade(page: Page) {
  await page.locator('.marketing-demo-fade').evaluateAll((elements) => {
    for (const element of elements)
      for (const animation of element.getAnimations()) animation.finish();
  });
}
