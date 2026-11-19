import { showPlanningDay } from './planning-fixtures';
import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('preserves selection and entered details across a compact booking journey with one terms panel', async ({
  page,
}) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(page.locator('h1')).toHaveCount(1);
  const fullDay = page.getByRole('checkbox', { name: 'Afficher les 24 heures', exact: true });
  await showPlanningDay(page);
  await fullDay.check();
  await expect(page.locator('.planning-hours > span').first()).toHaveText('00:00');
  await fullDay.uncheck();
  await expect(page.locator('.planning-hours > span').first()).toHaveText('14:00');
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Initiation à la céramique');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#participant-terms')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Alex');
  await page.getByRole('button', { name: 'Modifier la séance', exact: true }).click();
  await showPlanningDay(page);
  await expect(page.locator('.planning-event[aria-pressed=true]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Prénom', exact: true })).toHaveValue('Alex');
  await page.locator('#participant-terms > summary').click();
  await expect(page.locator('#participant-terms .ice-terms-text')).toBeVisible();
  await noHorizontalOverflow(page);
});
