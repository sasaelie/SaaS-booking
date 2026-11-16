import { expect, test, type Page } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  noHorizontalOverflow,
} from './portal-fixtures';
import { PARTICIPANT_UI as UI } from '../../src/config/constants';
test.afterAll(closeBrowserDatabase);
async function twoChoices() {
  const space = await browserSpace();
  const date = new Date(space.date.getTime() + 3 * 3600000);
  await browserDatabase().query(
    'INSERT INTO sessions(organization_id,activity_id,starts_at,ends_at,capacity,is_manual) VALUES($1,$2,$3,$4,8,true)',
    [space.organizationId, space.activityId, date, new Date(date.getTime() + 7200000)],
  );
  return space;
}
async function complete(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  await page.goto(`/${space.slug}/${space.activityId}`);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Alex');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Audit');
  await page
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill('audit@example.invalid');
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  await expect(page.locator('.ice-result')).toContainText('Votre place est réservée.');
}
test('makes a chosen time slot unmistakable, keeps its category color on hover and supports the keyboard', async ({
  page,
}, info) => {
  const space = await twoChoices();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  const choices = page.locator('.planning-event'),
    first = choices.first(),
    second = choices.last();
  await expect(choices).toHaveCount(2);
  await second.click();
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(second.locator('.planning-selection-mark')).toHaveCSS('opacity', '1');
  await expect(first.locator('.planning-selection-mark')).toHaveCSS('opacity', '0');
  await expect(second).toHaveCSS(
    'border-top-color',
    await second
      .locator('.planning-event-light')
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  );
  await second.hover();
  await expect(second.locator('.planning-selection-mark')).toHaveCSS('opacity', '1');
  expect(await second.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(
    await first.evaluate((e) => getComputedStyle(e).backgroundColor),
  );
  await first.focus();
  await first.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await page
    .locator('.session-planning')
    .screenshot({ path: info.outputPath('selection-lumineuse.png') });
});
test('keeps the full code readable and places copy next to it, with a single prominent ticket download', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 900 });
  await complete(page, space);
  const code = page.getByLabel(UI.CODE, { exact: true });
  await expect(code).toHaveValue(/^CLI-/);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    expect(await code.evaluate((e) => e.scrollHeight <= e.clientHeight + 1)).toBe(true);
  }
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: UI.COPY, exact: true }).click();
  await expect(page.getByRole('button', { name: UI.COPIED, exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await code.inputValue());
  await expect(page.getByRole('link', { name: UI.SAVE, exact: true })).toHaveAttribute(
    'download',
    'billet-reservation.pdf',
  );
  await expect(
    page.getByRole('link', { name: 'Gérer ma réservation', exact: true }),
  ).not.toHaveClass(/liquid-ice-button/);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: info.outputPath('confirmation-epuree.png'), fullPage: true });
});
test('attempts the durable confirmation even when the participant closes the completed page', async ({
  page,
}) => {
  const space = await browserSpace();
  await complete(page, space);
  await page.close();
  await expect
    .poll(async () => {
      const result = await browserDatabase().query(
        "SELECT j.attempts,j.completed_at FROM outbox_jobs j JOIN bookings b ON b.id::text=j.payload->>'bookingId' WHERE j.organization_id=$1 AND j.type='CONFIRMATION' AND b.status='CONFIRMED'",
        [space.organizationId],
      );
      const row = result.rows[0];
      return Boolean(row && (row.attempts > 0 || row.completed_at));
    })
    .toBe(true);
});
