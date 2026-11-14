import { expect, test } from '@playwright/test';
test('serves meaningful server-rendered metadata and blocks indexing on the test environment', async ({
  page,
}) => {
  const response = await page.goto('/');
  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  await expect(page).toHaveTitle(/Réservations en ligne pour ateliers et associations/);
  expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain(
    'Bancontact',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'fr_BE');
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
  if (!imageUrl) throw new Error('The public page must expose a social preview image');
  const image = await page.request.get(imageUrl);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  expect((await image.body()).subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  const robots = await page.request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /');
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('<loc>');
  const account = await page.request.get('/connexion');
  expect(account.headers()['x-robots-tag']).toBe('noindex, nofollow');
});
test('shows every professional field and keeps empty contact values inactive until completed', async ({
  page,
}) => {
  await page.goto('/mentions-legales');
  await expect(page.locator('.marketing-document-identity dt')).toHaveText([
    'Nom ou raison sociale',
    'Adresse professionnelle',
    'Numéro d’entreprise',
    'Numéro de TVA (si applicable)',
    'Régime de TVA',
    'Adresse e-mail',
    'Téléphone',
  ]);
  await expect(page.locator('.marketing-document-identity dd')).toHaveText(
    Array.from({ length: 7 }, () => 'À compléter'),
  );
  await page.goto('/contact');
  await expect(page.locator('.marketing-document-identity dt')).toHaveText([
    'Adresse e-mail',
    'Téléphone',
  ]);
  await expect(
    page.locator('a[href=""], a[href="#"], a[href="mailto:"], a[href="tel:"]'),
  ).toHaveCount(0);
});
