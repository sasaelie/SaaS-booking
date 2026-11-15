import { expect, type Page } from '@playwright/test';
import { MARKETING_DEMO as DEMO, type DemoPhase } from '../../src/config/marketing-demo';
export async function advanceDemoPhase(page: Page, phase: DemoPhase) {
  const scene = DEMO.STEPS.find((step) => step.key === phase);
  expect(scene).toBeDefined();
  const region = page.locator('.marketing-preview-wrap');
  await page.clock.runFor((scene?.delayMs ?? 0) - DEMO.FADE_OUT_MS - DEMO.FADE_IN_MS + 100);
  await expect(region).toHaveAttribute('data-transition', 'out');
  await page.clock.runFor(DEMO.FADE_OUT_MS + 1);
  await expect(region).toHaveAttribute('data-transition', 'in');
  await page.clock.runFor(DEMO.FADE_IN_MS + 1);
  await expect(region).toHaveAttribute('data-transition', 'idle');
}
