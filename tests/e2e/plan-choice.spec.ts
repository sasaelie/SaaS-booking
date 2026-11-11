import { expect, test } from '@playwright/test';
import {
  browserDatabase,
  browserSpace,
  browserUser,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('keeps entire offer cards compact, keyboard accessible and free of nested commands', async ({
  page,
}, info) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const cards = page.locator('.commercial-plan-card');
    await expect(cards).toHaveCount(2);
    expect(await cards.locator('button,a,input,summary').count()).toBe(0);
    const bounds = await cards.evaluateAll((es) => es.map((e) => e.getBoundingClientRect().height));
    for (const height of bounds) expect(height).toBeLessThan(320);
    await noHorizontalOverflow(page);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: info.outputPath('compact-offers.png'), fullPage: true });
  await page
    .locator('.commercial-plan-card')
    .first()
    .click({ position: { x: 8, y: 25 } });
  await expect(page).toHaveURL('/inscription?formule=liberte');
  await page.goto('/');
  const pro = page.getByRole('link', {
    name: 'Choisir Studio Pro — 29 € par mois ou 260 € par an',
  });
  await pro.focus();
  await pro.press('Enter');
  await expect(page).toHaveURL('/inscription?formule=pro');
  await page.getByRole('link', { name: 'J’ai déjà un compte', exact: true }).click();
  await expect(page).toHaveURL('/connexion?formule=pro');
  await page.getByRole('link', { name: 'Mot de passe oublié ?', exact: true }).click();
  await expect(page).toHaveURL('/mot-de-passe-oublie?formule=pro');
});
test('reveals the full comparison separately from the clickable cards', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('.commercial-comparison');
  await expect(details.getByText('Widget pour votre site', { exact: true })).toBeHidden();
  await details.locator('summary').click();
  await expect(details.getByText('Widget pour votre site', { exact: true })).toBeVisible();
  await expect(page).toHaveURL('/');
});
test('retains the Pro preference after real sign-in and space creation without granting Pro', async ({
  page,
}) => {
  const user = await browserUser();
  await page.goto('/connexion?formule=pro');
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(user.actor.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL('/app/nouveau?formule=pro');
  await page.getByLabel('Nom de l’organisation', { exact: true }).fill('Atelier en Studio Pro');
  await page
    .getByLabel('Personnalisez votre lien de réservation', { exact: true })
    .fill(`choix-${crypto.randomUUID()}`);
  await page.getByRole('button', { name: 'Créer mon espace', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/[a-f0-9-]+\/abonnement\?formule=pro$/);
  const organizationId = new URL(page.url()).pathname.split('/')[2];
  await expect(page.getByRole('radio', { name: /Annuel/ })).toBeVisible();
  await page.getByRole('radio', { name: /Annuel/ }).check();
  await expect(page.getByRole('radio', { name: /Annuel/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Paiement désactivé en test' })).toBeDisabled();
  const access = await browserDatabase().query(
    'SELECT complimentary,status FROM organization_access WHERE organization_id=$1',
    [organizationId],
  );
  expect(access.rows[0]).toMatchObject({ complimentary: false, status: 'INACTIVE' });
  const forced = await page.request.post('/api/portal/command', {
    data: {
      action: 'subscription',
      input: { organizationId, operation: 'checkout', interval: 'year' },
    },
    headers: { Origin: new URL(page.url()).origin },
  });
  expect(forced.ok()).toBe(false);
});
test('returns a connected organizer to their own formula and asks before choosing between multiple spaces', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto('/inscription?formule=pro');
  await expect(page).toHaveURL(`/app/${space.organizationId}/abonnement?formule=pro`);
  const created = await page.request.post('/api/portal/command', {
    data: {
      action: 'create-organization',
      input: {
        name: 'Second espace',
        slug: `choix-${crypto.randomUUID()}`,
        kind: 'NONPROFIT',
        timezone: 'Europe/Brussels',
      },
    },
    headers: { Origin: new URL(page.url()).origin },
  });
  expect(created.ok()).toBe(true);
  await page.goto('/app?formule=liberte');
  await expect(
    page.getByRole('heading', { name: 'Pour quel espace ?', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.portal-organization-card')).toHaveCount(2);
  const chosen = page
    .locator('.portal-organization-card')
    .filter({ hasText: 'Ateliers du quartier' });
  await chosen.click();
  await expect(page).toHaveURL(`/app/${space.organizationId}/abonnement?formule=liberte`);
  await expect(
    page.getByText('Votre accès offert est géré par l’administrateur.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Résilier le renouvellement', exact: true }),
  ).toHaveCount(0);
});
test('records only a fixed internal verification callback and rejects forged plan preferences', async ({
  page,
}) => {
  await page.goto('/inscription?formule=pro');
  let callback = '';
  await page.route('**/api/auth/sign-up/email', async (route) => {
    callback = String((route.request().postDataJSON() as { callbackURL: string }).callbackURL);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.getByLabel('Votre nom', { exact: true }).fill('Compte de test');
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('test@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Local-test-password-123!');
  await page
    .getByLabel('Confirmer le mot de passe', { exact: true })
    .fill('Local-test-password-123!');
  await page.getByRole('button', { name: 'Créer mon compte', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Consultez votre messagerie');
  expect(callback).toBe(`${new URL(page.url()).origin}/app?formule=pro`);
  await page.goto('/connexion?formule=https%3A%2F%2Fevil.example');
  await expect(page.locator('.commercial-intent-note')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Créer un compte', exact: true })).toHaveAttribute(
    'href',
    '/inscription',
  );
});
