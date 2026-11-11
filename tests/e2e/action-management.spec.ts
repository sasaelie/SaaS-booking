import { expect, test } from '@playwright/test';
import { browserSpace, browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import { addAuditActivity } from './action-audit-fixtures';
test.afterAll(closeBrowserDatabase);
test('edits activity information and saves the changed public title', async ({ page }) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites/${space.activityId}`);
  await page.getByText('Modifier les informations', { exact: true }).click();
  await page
    .getByLabel('Titre de l’activité', { exact: true })
    .fill('Atelier modifié par le formulaire');
  await page.getByLabel('Tarif par personne (€)', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('enregistrées');
  expect(
    (
      await browserDatabase().query('SELECT name,price_cents FROM activities WHERE id=$1', [
        space.activityId,
      ])
    ).rows[0],
  ).toMatchObject({ name: 'Atelier modifié par le formulaire', price_cents: 0 });
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Voir la page publique', exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.locator('h1')).toContainText('Atelier modifié par le formulaire');
});
test('adds a dated session through its form without changing the existing session', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites/${space.activityId}`);
  await page.locator('summary').filter({ hasText: 'Ajouter une séance à date précise' }).click();
  const form = page.locator('form').filter({
    has: page.getByRole('button', { name: 'Ajouter une séance à date précise', exact: true }),
  });
  const date = new Date(space.date.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  await form.getByLabel('Date de début', { exact: true }).fill(date);
  await form.getByLabel('Places par séance', { exact: true }).fill('12');
  await form.getByRole('button').click();
  await expect(form.getByRole('status')).toContainText('enregistrées');
  const sessions = await browserDatabase().query(
    'SELECT capacity FROM sessions WHERE activity_id=$1 ORDER BY starts_at',
    [space.activityId],
  );
  expect(sessions.rows.map((s) => s.capacity)).toEqual([8, 12]);
});
test('archives and republishes through the buttons and changes participant availability accordingly', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites/${space.activityId}`);
  await page.locator('summary').filter({ hasText: 'Archiver cette activité' }).click();
  const archive = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Archiver cette activité', exact: true }) });
  await archive.getByRole('checkbox').check();
  await archive.getByRole('button').click();
  await expect(
    page.getByRole('button', { name: 'Publier cette activité', exact: true }),
  ).toBeVisible();
  expect(
    (
      await browserDatabase().query('SELECT is_active FROM activities WHERE id=$1', [
        space.activityId,
      ])
    ).rows[0].is_active,
  ).toBe(false);
  const closed = await page.request.get(`/${space.slug}/${space.activityId}`);
  expect(await closed.text()).not.toContain('name="session"');
  await page.getByRole('button', { name: 'Publier cette activité', exact: true }).click();
  await expect(page.getByText('Publiée', { exact: true })).toBeVisible();
  expect(
    (
      await browserDatabase().query('SELECT is_active FROM activities WHERE id=$1', [
        space.activityId,
      ])
    ).rows[0].is_active,
  ).toBe(true);
  await page.goto(`/${space.slug}/${space.activityId}`);
  await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toBeVisible();
});
test('adds a pause using its date and reason inputs and persists the intended interval', async ({
  page,
}) => {
  const space = await browserSpace();
  const activity = await addAuditActivity(space, 'Activité avec pause');
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites/${activity.activityId}`);
  await page.locator('summary').filter({ hasText: 'Ajouter une période de pause' }).click();
  const form = page.locator('form').filter({
    has: page.getByRole('button', { name: 'Ajouter une période de pause', exact: true }),
  });
  const day = space.date.toISOString().slice(0, 10);
  await form.getByLabel('Premier jour de pause', { exact: true }).fill(day);
  await form.getByLabel('Dernier jour de pause', { exact: true }).fill(day);
  await form.getByLabel('Motif', { exact: true }).fill('Fermeture de test');
  await form.getByRole('button').click();
  await expect(form.getByRole('status')).toContainText(/effectuée|enregistr/);
  expect(
    (
      await browserDatabase().query(
        'SELECT count(*)::int AS count FROM pause_periods WHERE activity_id=$1',
        [activity.activityId],
      )
    ).rows[0].count,
  ).toBe(1);
});
