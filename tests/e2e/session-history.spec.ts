import { expect, test } from '@playwright/test';
import {
  browserDatabase,
  browserSpace,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('shows a connected home on direct entry and skips account entry forms', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Se connecter', exact: true })).toBeVisible();
  await login(page, space);
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Connecté en tant que')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir mes espaces', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Se connecter', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Créer un compte organisateur', exact: true }),
  ).toHaveCount(0);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('connected-home-mobile.png'), fullPage: true });
  for (const path of ['/connexion', '/inscription']) {
    await page.goto(path);
    await expect(page).toHaveURL('/app');
    await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveCount(0);
  }
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Choisir Studio Pro — 29 € par mois ou 260 € par an' })
    .click();
  await expect(page).toHaveURL(`/app/${space.organizationId}/abonnement?formule=pro`);
});
test('signs out from home and refuses a private page restored through the Back button', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites`);
  await page.goto('/');
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  await expect(page).toHaveURL('/connexion');
  expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
  await page.goBack();
  await expect(page).toHaveURL('/connexion');
  await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Se connecter', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir mes espaces', exact: true })).toHaveCount(0);
});
test('revalidates an expired server session when a cached page reports restoration', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Ouvrir mes espaces', exact: true })).toBeVisible();
  await browserDatabase().query(
    'UPDATE session SET "expiresAt"=now()-interval \'1 second\' WHERE "userId"=$1',
    [space.actor.id],
  );
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await expect(page.getByRole('link', { name: 'Se connecter', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir mes espaces', exact: true })).toHaveCount(0);
  await page.goto('/app');
  await expect(page).toHaveURL('/connexion');
  expect(await (await page.request.get('/api/auth/get-session')).json()).toBeNull();
});
test('does not share personalized home content with another browser or trust a forged session cookie', async ({
  page,
  browser,
}) => {
  const space = await browserSpace();
  await login(page, space);
  const response = await page.goto('/');
  expect(response?.headers()['cache-control']).toContain('no-store');
  await expect(page.getByRole('link', { name: 'Ouvrir mes espaces', exact: true })).toBeVisible();
  const other = await browser.newContext();
  try {
    const guest = await other.newPage();
    await other.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'forged.invalid.signature',
        url: new URL(page.url()).origin,
        httpOnly: true,
      },
    ]);
    const publicResponse = await guest.goto(page.url());
    expect(publicResponse?.headers()['cache-control']).toContain('no-store');
    await expect(guest.getByRole('link', { name: 'Se connecter', exact: true })).toBeVisible();
    await expect(guest.getByText(space.actor.name, { exact: true })).toHaveCount(0);
    await expect(guest.getByRole('link', { name: 'Ouvrir mes espaces', exact: true })).toHaveCount(
      0,
    );
    await guest.goto(`${new URL(page.url()).origin}/app`);
    await expect(guest).toHaveURL(/\/connexion$/);
  } finally {
    await other.close();
  }
});
