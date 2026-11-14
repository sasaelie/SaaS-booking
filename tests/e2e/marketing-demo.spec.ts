import { expect, test } from '@playwright/test';
import { MARKETING_PREVIEW as UI } from '../../src/config/marketing-preview';
test('links the selected activity, image, session and simulated booking without writing to the server', async ({
  page,
}) => {
  let writes = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') writes++;
  });
  await page.goto('/');
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
    await expect(calendar).toHaveAttribute('data-booked', 'false');
    await page.getByRole('button', { name: UI.SIMULATE, exact: true }).click();
    await expect(calendar).toHaveAttribute('data-booked', 'true');
    await expect(calendar).toContainText(UI.SIMULATED);
    await expect(calendar).toBeFocused();
    await expect(calendar).toBeInViewport();
  }
  expect(writes).toBe(0);
});
test('automatically shows the booking result before moving to the next synchronized example', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  const preview = page.locator('.marketing-preview-wrap');
  await preview.getByRole('button', { name: UI.PAUSE, exact: true }).click();
  await preview.getByRole('button', { name: UI.PLAY, exact: true }).click();
  const calendar = page.locator('.marketing-calendar-preview');
  for (const example of [...UI.EXAMPLES, UI.EXAMPLES[0]]) {
    await expect(page.getByRole('heading', { name: example.title, exact: true })).toBeVisible();
    await expect(calendar).toContainText(example.title);
    await expect(calendar).toContainText(example.sessions[0].label);
    await expect(calendar).toHaveAttribute('data-booked', 'false');
    await page.clock.runFor(UI.SELECTION_DELAY_MS + 1);
    await expect(calendar).toHaveAttribute('data-booked', 'true');
    await page.clock.runFor(UI.RESULT_DELAY_MS + 1);
  }
});
test('pauses at keyboard interaction and resumes only on explicit request', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('radio', { name: 'Ateliers', exact: true }).focus();
  await expect(
    page.locator('.marketing-preview-wrap').getByRole('button', { name: UI.PLAY, exact: true }),
  ).toBeVisible();
  await page.clock.runFor(20000);
  await expect(page.getByRole('radio', { name: 'Ateliers', exact: true })).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Soins', exact: true })).toBeChecked();
  await page.clock.runFor(20000);
  await expect(page.getByRole('radio', { name: 'Soins', exact: true })).toBeChecked();
  await expect(page.locator('.marketing-calendar-preview')).toHaveAttribute('data-booked', 'false');
  await page
    .locator('.marketing-preview-wrap')
    .getByRole('button', { name: UI.PLAY, exact: true })
    .click();
  await page.clock.runFor(UI.SELECTION_DELAY_MS + 1);
  await expect(page.locator('.marketing-calendar-preview')).toHaveAttribute('data-booked', 'true');
  await page.clock.runFor(UI.RESULT_DELAY_MS + 1);
  await expect(page.getByRole('radio', { name: 'Sport', exact: true })).toBeChecked();
});
test('keeps reduced-motion examples static and stops cycling outside the visible demo', async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const preview = page.locator('.marketing-preview-wrap');
  await expect(preview.getByRole('button', { name: UI.PLAY, exact: true })).toBeVisible();
  await page.clock.runFor(20000);
  await expect(page.getByRole('radio', { name: 'Ateliers', exact: true })).toBeChecked();
  await expect(page.locator('.marketing-calendar-preview')).toHaveAttribute('data-booked', 'false');
  await preview.getByRole('button', { name: UI.PLAY, exact: true }).click();
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(preview).not.toBeInViewport();
  await expect(page.locator('.marketing-story-demo')).not.toBeInViewport();
  await page.clock.runFor(20000);
  await expect(page.getByRole('radio', { name: 'Ateliers', exact: true })).toBeChecked();
});
