import { expect, test, type Page } from '@playwright/test';
import { MARKETING_DEMO as DEMO, type DemoPhase } from '../../src/config/marketing-demo';
import { advanceDemoPhase, finishDemoFade, holdDemoAnimations } from './marketing-demo-clock';
test('keeps commands, unchanged date and availability visible when choosing an hour, then only updates the count on booking', async ({
  page,
}) => {
  await openDemo(page);
  await advanceDemoPhase(page, 'draft');
  await beginExit(page, 'published');
  await expectStable(
    page,
    '.marketing-preview-flow, .marketing-preview-sessions legend, .marketing-preview-sessions label, .marketing-preview-flow button, .marketing-preview-flow a, .marketing-preview-count, .marketing-preview-unit, .marketing-calendar-stage, .marketing-calendar-week, .marketing-calendar-event strong, .marketing-calendar-date',
  );
  await expect(page.locator('.marketing-calendar-time')).toHaveCSS('opacity', '0');
  await finishDemoFade(page);
  await expect(page.locator('.marketing-calendar-time')).toContainText('14:00');
  await finishDemoFade(page);
  await beginExit(page, 'selected');
  await expectStable(
    page,
    '.marketing-preview-flow, .marketing-preview-sessions label, .marketing-preview-flow button, .marketing-preview-flow a, .marketing-preview-unit, .marketing-calendar-stage, .marketing-calendar-week, .marketing-calendar-event strong, .marketing-calendar-date, .marketing-calendar-time',
  );
  await expect(page.locator('.marketing-preview-count')).toHaveCSS('opacity', '0');
  await finishDemoFade(page);
  await expect(page.locator('.marketing-preview-count')).toHaveText('4');
  await expect(page.locator('.marketing-calendar-time')).toContainText('14:00');
  await finishDemoFade(page);
});
test('fades the date only when the selected sport session moves to another day', async ({
  page,
}) => {
  await openDemo(page);
  await page.getByRole('radio', { name: 'Sport', exact: true }).check();
  await page.clock.runFor(100);
  await beginExit(page, 'published');
  await expectStable(
    page,
    '.marketing-preview-flow, .marketing-calendar-week, .marketing-calendar-event strong, .marketing-preview-count',
  );
  await expect(page.locator('.marketing-calendar-date')).toContainText('Mercredi 18');
  await expect(page.locator('.marketing-calendar-date')).toHaveCSS('opacity', '0');
  await finishDemoFade(page);
  await expect(page.locator('.marketing-calendar-date')).toContainText('Samedi 21');
  await expect(page.locator('.marketing-calendar-week [data-active="true"]')).toHaveText('21');
  await finishDemoFade(page);
});
async function openDemo(page: Page) {
  await page.clock.install();
  await page.goto('/');
  await holdDemoAnimations(page);
  await page.locator('.marketing-preview-wrap').scrollIntoViewIfNeeded();
  await page.clock.runFor(100);
}
async function beginExit(page: Page, phase: DemoPhase) {
  const step = DEMO.STEPS.find((scene) => scene.key === phase);
  await page.clock.runFor((step?.delayMs ?? 0) - DEMO.FADE_OUT_MS - DEMO.FADE_IN_MS + 100);
  await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-transition', 'out');
  await page.locator('.marketing-demo-fade').evaluateAll((elements) => {
    for (const element of elements)
      for (const animation of element.getAnimations()) animation.currentTime = 1000;
  });
}
async function expectStable(page: Page, selector: string) {
  const values = await page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      let opacity = 1;
      for (let node: Element | null = element; node; node = node.parentElement)
        opacity *= Number(getComputedStyle(node).opacity);
      return opacity;
    }),
  );
  expect(values.length).toBeGreaterThan(0);
  for (const value of values) expect(value).toBe(1);
}
