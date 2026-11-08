import { expect, test } from '@playwright/test';
import {
  browserDatabase,
  closeBrowserDatabase,
  browserUser,
  browserSpace,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { createSpaceInBrowser, grantInBrowser, publishInBrowser } from './portal-onboarding';
test.afterAll(async () => {
  await closeBrowserDatabase();
});
test('creates an organization and publishes an event through the real authenticated interfaces', async ({
  page,
}, info) => {
  const user = await browserUser(true);
  await login(page, user);
  const { id, slug } = await createSpaceInBrowser(page);
  if (!id) throw Error('Missing organization');
  await grantInBrowser(page, slug);
  await publishInBrowser(page, id);
  await page.goto(`/app/${id}`);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('organizer-dashboard.png'), fullPage: true });
});
test('renders all organizer screens coherently on desktop and mobile and downloads a real QR code', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const suffix of [
      '',
      '/activites',
      '/reservations',
      '/abonnement',
      '/parametres',
      '/reglages',
      '/partager',
    ]) {
      await page.goto(`/app/${space.organizationId}${suffix}`);
      await expect(page.locator('main h1')).toBeVisible();
      await noHorizontalOverflow(page);
      if (width !== 320)
        await page.screenshot({
          path: info.outputPath(`${width}-${suffix.replaceAll('/', '') || 'dashboard'}.png`),
          fullPage: true,
        });
    }
  }
  await page.goto(`/plateforme?search=${space.slug}`);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: info.outputPath('platform-mobile.png'), fullPage: true });
  const qr = await page.request.get(`/api/portal/qr?organizationId=${space.organizationId}`);
  expect(qr.status()).toBe(200);
  expect((await qr.body()).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(failures).toEqual([]);
});
test('refuses foreign organizations and cross-origin cookie mutations', async ({ page }) => {
  const own = await browserSpace();
  const other = await browserSpace();
  await login(page, own);
  await page.goto(`/app/${other.organizationId}`);
  await expect(
    page.getByText('Cet espace est introuvable ou vous n’y avez pas accès.', { exact: true }),
  ).toBeVisible();
  const result = await page.request.post('/api/portal/command', {
    headers: { Origin: 'https://untrusted.example' },
    data: {
      action: 'grant-access',
      input: { organizationId: own.organizationId, complimentary: true },
    },
  });
  expect(result.status()).toBe(403);
  expect(
    (await page.request.get('/api/portal/qr?organizationId=' + other.organizationId)).ok(),
  ).toBe(false);
});
test('keeps paid-period access after cancellation, blocks new bookings after expiry and still permits account management', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await browserDatabase().query(
    "UPDATE organization_access SET complimentary=false,status='ACTIVE',cancel_at_period_end=true,current_period_end=now()+interval '1 day' WHERE organization_id=$1",
    [space.organizationId],
  );
  await page.goto(`/app/${space.organizationId}`);
  await expect(page.getByText('Renouvellement désactivé.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Créer une activité', exact: true })).toBeVisible();
  await browserDatabase().query(
    "UPDATE organization_access SET current_period_end=now()-interval '1 second' WHERE organization_id=$1",
    [space.organizationId],
  );
  await page.goto(`/app/${space.organizationId}`);
  const accessTitle =
    process.env['STAGING_BROWSER_TEST'] === 'true'
      ? 'Votre accès de test est à activer.'
      : 'Votre abonnement n’est pas actif.';
  await expect(page.getByText(accessTitle, { exact: true })).toBeVisible();
  await page.goto(`/app/${space.organizationId}/activites/nouvelle`);
  await expect(page.getByRole('button', { name: 'Créer et publier', exact: true })).toBeDisabled();
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(
    page.getByText(
      'Les réservations sont actuellement fermées. Contactez l’organisateur pour toute question.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto(`/app/${space.organizationId}/reservations`);
  await expect(page.locator('main h1')).toContainText('Réservations');
});
