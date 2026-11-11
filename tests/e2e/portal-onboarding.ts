import { expect, type Page } from '@playwright/test';
export async function createSpaceInBrowser(page: Page) {
  const slug = `evenement-${crypto.randomUUID()}`;
  const create = page.locator('main').getByRole('link', { name: 'Créer un espace', exact: true });
  await expect(create).toHaveCount(1);
  await create.click();
  await page.getByLabel('Nom de l’organisation', { exact: true }).fill('Les rencontres du samedi');
  await page.getByLabel('Personnalisez votre lien de réservation', { exact: true }).fill(slug);
  await page.getByRole('button', { name: 'Créer mon espace', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/[a-f0-9-]+$/);
  const id = page.url().split('/').pop();
  expect(id).toBeTruthy();
  await expect(page.getByText('Formule Liberté', { exact: true })).toBeVisible();
  return { id, slug };
}
export async function grantInBrowser(page: Page, slug: string) {
  await page.goto(`/plateforme?search=${slug}`);
  const row = page.getByRole('article').filter({ hasText: slug });
  await row.locator('summary').click();
  const form = row
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Accorder un accès offert', exact: true }) });
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Accorder un accès offert', exact: true }).click();
  await expect(row.getByText('Accès offert', { exact: true })).toBeVisible();
}
export async function publishInBrowser(page: Page, id: string) {
  await page.goto(`/app/${id}/activites/nouvelle`);
  await page.getByLabel('Titre de l’activité', { exact: true }).fill('Rencontre créative');
  await page.getByLabel('Tarif par personne (€)', { exact: true }).fill('19,99');
  await page
    .getByLabel('Date de début', { exact: true })
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] ?? '');
  await page.getByRole('button', { name: 'Créer et publier', exact: true }).click();
  await expect(page).toHaveURL(/\/activites\/[a-f0-9-]+$/);
  await expect(
    page.getByRole('heading', { name: 'Rencontre créative', exact: true, level: 1 }),
  ).toBeVisible();
}
