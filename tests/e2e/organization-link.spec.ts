import { expect, test } from '@playwright/test';
import { browserUser, login, closeBrowserDatabase, noHorizontalOverflow } from './portal-fixtures';

test.afterAll(async () => {
  await closeBrowserDatabase();
});

test('suggests a reservation link and explains invalid input in French on mobile', async ({
  page,
}) => {
  const user = await browserUser();
  await login(page, user);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/nouveau');
  const name = page.getByLabel('Nom de l’organisation', { exact: true });
  const slug = page.getByLabel('Nom du lien de réservation', { exact: true });
  const form = page.locator('form').filter({ has: slug });
  await name.fill('L’Atelier Créatif');
  await expect(slug).toHaveValue('l-atelier-creatif');
  await expect(page.getByLabel('Aperçu de votre lien')).toContainText('/l-atelier-creatif');
  await noHorizontalOverflow(page);
  await slug.fill('Rue exemple 12');
  await page.getByRole('button', { name: 'Créer mon espace', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('sans espace. Exemple : mon-atelier');
  await expect(slug).toHaveAttribute('aria-invalid', 'true');
  await name.fill('Autre atelier');
  await expect(slug).toHaveValue('Rue exemple 12');
  await slug.fill('admin');
  await slug.press('Tab');
  await expect(form.getByRole('alert')).toContainText('Ce nom est réservé');
  await slug.fill(`atelier-${crypto.randomUUID()}`);
  await page.getByRole('button', { name: 'Créer mon espace', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/[a-f0-9-]+$/);
  await noHorizontalOverflow(page);
});
