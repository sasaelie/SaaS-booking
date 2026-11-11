import { expect, test } from '@playwright/test';
import {
  browserDatabase,
  browserSpace,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('confirms only leaving My spaces, preserves cancellation and actually revokes the session on approval', async ({
  page,
}) => {
  const space = await browserSpace();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await login(page, space);
    const back = page.getByRole('link', { name: 'Retour à l’accueil', exact: true });
    await back.click();
    const dialog = page.getByRole('dialog', { name: 'Quitter Mes espaces ?' });
    await expect(dialog).toContainText('Vous allez être déconnecté');
    await dialog.getByRole('button', { name: 'Rester connecté', exact: true }).click();
    await expect(page).toHaveURL('/app');
    expect(await (await page.request.get('/api/auth/get-session')).json()).not.toBeNull();
    await back.click();
    await dialog.getByRole('button', { name: 'Me déconnecter', exact: true }).click();
    await expect(page).toHaveURL('/');
    expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
  }
});
test('warns on real browser Back from My spaces and cancellation returns to the authenticated list', async ({
  page,
}) => {
  const space = await browserSpace();
  await page.goto('/');
  await login(page, space);
  await page.goBack();
  const dialog = page.getByRole('dialog', { name: 'Quitter Mes espaces ?' });
  await expect(dialog).toBeVisible();
  expect(await (await page.request.get('/api/auth/get-session')).json()).not.toBeNull();
  await dialog.getByRole('button', { name: 'Rester connecté', exact: true }).click();
  await expect(page).toHaveURL('/app');
  await page.goto(`/app/${space.organizationId}/activites`);
  await page.getByRole('link', { name: 'Retour au tableau de bord', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(`/app/${space.organizationId}`);
});
test('reports a failed sign-out and keeps the existing session instead of pretending it was closed', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.getByRole('link', { name: 'Retour à l’accueil', exact: true }).click();
  await page.route('**/api/auth/sign-out', (route) => route.fulfill({ status: 503, body: '{}' }));
  const dialog = page.getByRole('dialog', { name: 'Quitter Mes espaces ?' });
  await dialog.getByRole('button', { name: 'Me déconnecter', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  expect(await (await page.request.get('/api/auth/get-session')).json()).not.toBeNull();
  await dialog.getByRole('button', { name: 'Rester connecté', exact: true }).click();
  await expect(page).toHaveURL('/app');
});
test('opens the monthly and annual test recap without sending a subscription command', async ({
  page,
}) => {
  const space = await browserSpace();
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=false WHERE organization_id=$1',
    [space.organizationId],
  );
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/abonnement?formule=pro`);
  let commands = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/portal/command') && request.method() === 'POST') commands++;
  });
  for (const [name, amount] of [
    [/Mensuel/, '29,00 €'],
    [/Annuel/, '260,00 €'],
  ] as const) {
    await page.getByRole('radio', { name }).check();
    await page.getByRole('button', { name: 'Voir le récapitulatif de test' }).click();
    const dialog = page.getByRole('dialog', { name: 'Récapitulatif — démonstration' });
    await expect(dialog.locator('.billing-review-total')).toContainText(amount);
    await expect(dialog).toContainText('Stripe n’est pas raccordé');
    await dialog.getByRole('button', { name: 'Revenir au choix de la formule' }).click();
  }
  expect(commands).toBe(0);
  const result = await browserDatabase().query(
    'SELECT status,complimentary FROM organization_access WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(result.rows[0]).toMatchObject({ status: 'INACTIVE', complimentary: false });
});
test('explains complimentary access and shows zero due without changing it', async ({ page }) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/abonnement?formule=pro`);
  await expect(page.getByText(/vous n’avez rien à payer/)).toBeVisible();
  await page.getByRole('button', { name: 'Voir le récapitulatif de test' }).click();
  await expect(page.getByRole('dialog').locator('.billing-review-total')).toContainText('0,00 €');
  const result = await browserDatabase().query(
    'SELECT complimentary FROM organization_access WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(result.rows[0]?.complimentary).toBe(true);
});
test('details every comparison category and uses glass frames and text links without underlining', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.commercial-comparison > summary').click();
  await expect(page.locator('.feature-comparison tbody tr')).toHaveCount(27);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noHorizontalOverflow(page);
  }
  await expect(page.getByText(/Aucun hébergement vidéo n’est fourni/)).toBeVisible();
  await page.goto('/connexion');
  const link = page.getByRole('link', { name: 'Mot de passe oublié ?', exact: true });
  await expect(link).toHaveCSS('text-decoration-line', 'none');
  await expect(link).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const panel = page.locator('.portal-auth-card');
  expect(await panel.evaluate((el) => getComputedStyle(el, '::before').pointerEvents)).toBe('none');
});
