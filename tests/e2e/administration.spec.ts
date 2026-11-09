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

test('hides administration and refuses its screens and mutations for ordinary organizers', async ({
  page,
}) => {
  const user = await browserUser();
  await login(page, user);
  await expect(page.getByRole('link', { name: 'Administration', exact: true })).toHaveCount(0);
  for (const suffix of ['', '/operations', '/historique']) {
    await page.goto(`/plateforme${suffix}`);
    await expect(
      page.getByRole('heading', {
        name: 'Cet espace est réservé aux administrateurs de la plateforme.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Administration', exact: true })).toHaveCount(
      0,
    );
  }
  const space = await browserSpace();
  const response = await page.request.post('/api/portal/command', {
    data: { action: 'suspend', input: { organizationId: space.organizationId, suspended: true } },
  });
  expect(response.ok()).toBe(false);
  const access = await browserDatabase().query(
    'SELECT suspended_at FROM organization_access WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(access.rows[0].suspended_at).toBeNull();
});

test('lets an administrator manage access and read the resulting audit history', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.getByRole('link', { name: 'Administration', exact: true }).click();
  await expect(page).toHaveURL(/\/plateforme$/);
  await page.getByLabel('Nom ou lien de l’organisation', { exact: true }).fill(space.slug);
  await page.getByRole('button', { name: 'Filtrer', exact: true }).click();
  const card = page.getByRole('article').filter({ hasText: space.slug });
  await card.getByText('Gérer l’accès', { exact: true }).click();
  const suspend = card.locator('form').filter({
    has: page.getByRole('button', {
      name: 'Suspendre les nouvelles réservations',
      exact: true,
    }),
  });
  await suspend.getByRole('checkbox').check();
  await suspend.getByRole('button').click();
  await expect(card.getByText('Suspendu', { exact: true })).toBeVisible();
  await page.goto(`/plateforme/historique?search=${space.slug}`);
  const event = page.getByRole('article').filter({ hasText: 'Nouvelles réservations suspendues' });
  await expect(event).toHaveCount(1);
  await expect(event).toContainText(space.actor.name);
  await expect(event).toContainText('Ateliers du quartier');
  await page.getByRole('link', { name: /Retour à mon espace organisateur/ }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test('shows read-only pending operations without secrets and fits admin screens at three widths', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await browserDatabase().query(
    "INSERT INTO outbox_jobs(organization_id,type,deduplication_key,payload,attempts,last_error) VALUES($1,'CONFIRMATION',$2,$3,2,'CONFIGURATION_ERROR')",
    [space.organizationId, crypto.randomUUID(), { secret: 'never-render-this' }],
  );
  await login(page, space);
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const suffix of ['', '/operations', '/historique']) {
      await page.goto(`/plateforme${suffix}?search=${space.slug}`);
      await expect(page.locator('main h1')).toBeVisible();
      await noHorizontalOverflow(page);
      if (suffix === '/operations') {
        await expect(page.getByRole('article')).toContainText('Un service doit être configuré.');
        await expect(page.getByRole('article')).toContainText('À réessayer');
        await expect(page.getByRole('article').getByRole('button')).toHaveCount(0);
        expect(await page.locator('main').textContent()).not.toContain('never-render-this');
      }
      if (width !== 320)
        await page.screenshot({
          path: info.outputPath(`administration-${width}-${suffix.slice(1) || 'overview'}.png`),
          fullPage: true,
        });
    }
  }
  expect(failures).toEqual([]);
});
