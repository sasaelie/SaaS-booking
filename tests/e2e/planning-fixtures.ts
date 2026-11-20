import { expect, type Page } from '@playwright/test';
export async function showPlanningDay(page: Page) {
  const calendar = page.locator('.session-planning');
  await expect(calendar).toBeVisible();
  const mobile = calendar.getByRole('combobox', { name: 'Affichage du planning', exact: true });
  const desktop = calendar.getByRole('button', { name: 'Journée', exact: true });
  await expect(mobile.or(desktop)).toBeVisible();
  if (await mobile.isVisible()) await mobile.selectOption('day');
  else await desktop.click();
  await expect(calendar).toHaveAttribute('data-view', 'day');
}
