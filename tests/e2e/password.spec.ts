import { expect, test, type Page } from '@playwright/test';
import { noHorizontalOverflow } from './portal-fixtures';

test('toggles each password independently without submitting or losing the entered value', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/connexion', '/inscription', '/nouveau-mot-de-passe']) {
    await page.goto(path);
    const password = page.getByLabel('Mot de passe', { exact: true });
    await password.fill('Browser-test-only-password-12345!');
    const toggle = page.getByRole('button', {
      name: 'Afficher le mot de passe : Mot de passe',
      exact: true,
    });
    await expect(password).toHaveAttribute('type', 'password');
    await toggle.focus();
    await toggle.press('Space');
    await expect(password).toHaveAttribute('type', 'text');
    await expect(password).toHaveValue('Browser-test-only-password-12345!');
    await expect(page.locator('form [role="alert"]')).toHaveCount(0);
    if (path !== '/connexion') await revealConfirmation(page);
    await page
      .getByRole('button', { name: 'Masquer le mot de passe : Mot de passe', exact: true })
      .click();
    await expect(password).toHaveAttribute('type', 'password');
    await noHorizontalOverflow(page);
  }
});

test('offers a visible recovery path and explains the reset email and missing reset link', async ({
  page,
}) => {
  await page.goto('/connexion');
  await page.getByRole('link', { name: 'Mot de passe oublié ?', exact: true }).click();
  await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
  await expect(page.getByText(/Indiquez l’adresse e-mail de votre compte/)).toBeVisible();
  await page
    .getByLabel('Adresse e-mail', { exact: true })
    .fill(`absent-${crypto.randomUUID()}@example.com`);
  await page.getByRole('button', { name: 'Recevoir le lien', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Si un compte correspond');
  await page.goto('/nouveau-mot-de-passe');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Replacement-password-12345!');
  await page
    .getByLabel('Confirmer le mot de passe', { exact: true })
    .fill('Replacement-password-12345!');
  await page.getByRole('button', { name: 'Enregistrer le mot de passe', exact: true }).click();
  await expect(page.locator('form [role="alert"]')).toContainText('Demandez un nouveau lien');
});

async function revealConfirmation(page: Page) {
  const confirmation = page.getByLabel('Confirmer le mot de passe', { exact: true });
  await expect(confirmation).toHaveAttribute('type', 'password');
  await page
    .getByRole('button', {
      name: 'Afficher le mot de passe : Confirmer le mot de passe',
      exact: true,
    })
    .click();
  await expect(confirmation).toHaveAttribute('type', 'text');
}
