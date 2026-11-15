import { expect, test, type Page } from '@playwright/test';
import { MARKETING_DEMO as DEMO } from '../../src/config/marketing-demo';
import { finishDemoFade, holdDemoAnimations } from './marketing-demo-clock';
test('keeps photos, frames and calendar heading opaque throughout every automatic step', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.locator('.marketing-preview-wrap').scrollIntoViewIfNeeded();
  await holdDemoAnimations(page);
  await page.clock.runFor(100);
  const height = await page
    .locator('.marketing-calendar-preview')
    .evaluate((e) => e.getBoundingClientRect().height);
  for (const scene of DEMO.STEPS) {
    await page.clock.runFor(scene.delayMs - DEMO.FADE_OUT_MS - DEMO.FADE_IN_MS + 100);
    await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-transition', 'out');
    await page.locator('.marketing-demo-fade').evaluateAll((elements) => {
      for (const element of elements)
        for (const animation of element.getAnimations()) animation.currentTime = 1000;
    });
    await expectOpaqueSurfaces(page);
    expect(
      await page
        .locator('.marketing-calendar-preview')
        .evaluate((e) => e.getBoundingClientRect().height),
    ).toBe(height);
    await expect(page.locator('.marketing-preview-copy')).toHaveCSS('opacity', '1');
    if (scene.key === 'booked') await checkPhotoBlend(page);
    await finishDemoFade(page);
    await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute('data-transition', 'in');
    await expectOpaqueSurfaces(page);
    if (scene.key === 'booked') await checkPhotoBlend(page);
    await finishDemoFade(page);
    await expect(page.locator('.marketing-preview-wrap')).toHaveAttribute(
      'data-transition',
      'idle',
    );
  }
  await expect(page.locator('.marketing-story-photo img')).toHaveCount(1);
  await expect(page.locator('.marketing-story-photo img')).toHaveAttribute('src', /soins/);
});
async function expectOpaqueSurfaces(page: Page) {
  const values = await page
    .locator(
      '.marketing-story-scene, .marketing-story-back, .marketing-story-photo, .marketing-calendar-preview, .marketing-calendar-preview h3, .marketing-preview, .marketing-preview-activity, .marketing-demo-photo:not(.marketing-demo-photo-blend)',
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        let opacity = 1;
        for (let node: Element | null = element; node; node = node.parentElement)
          opacity *= Number(getComputedStyle(node).opacity);
        return opacity;
      }),
    );
  for (const value of values) expect(value).toBe(1);
}
async function checkPhotoBlend(page: Page) {
  const photos = page.locator('.marketing-demo-photo-blend');
  await expect(photos).toHaveCount(2);
  await photos.evaluateAll((elements) => {
    for (const element of elements)
      for (const animation of element.getAnimations()) animation.currentTime = 1000;
  });
  for (const photo of await photos.all()) await expect(photo).toHaveCSS('opacity', '0.5');
  await expectOpaqueSurfaces(page);
}
