import { expect, test } from '@playwright/test';
import { noHorizontalOverflow } from './portal-fixtures';
test('makes the product and the real account action visible at common viewport sizes', async ({
  page,
}, info) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Vos réservations en ligne.',
    );
    await expect(
      page.getByRole('link', { name: 'Créer un compte organisateur', exact: true }),
    ).toBeInViewport();
    await noHorizontalOverflow(page);
    if ([390, 1440].includes(width))
      await page.screenshot({ path: info.outputPath(`accueil-${width}.png`), fullPage: true });
  }
  await page.getByRole('link', { name: 'Créer un compte organisateur', exact: true }).click();
  await expect(page).toHaveURL('/inscription');
  await expect(page.getByLabel('Adresse e-mail', { exact: true })).toBeVisible();
});
test('keeps examples local, accessible and clearly fictional before a real signup link', async ({
  page,
}) => {
  let writes = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') writes++;
  });
  await page.goto('/');
  const examples = page.getByRole('group', { name: 'Explorer un exemple d’activité' });
  await examples.getByRole('radio', { name: 'Ateliers', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(examples.getByRole('radio', { name: 'Soins', exact: true })).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Votre moment de soin' })).toBeVisible();
  await page.getByRole('radio', { name: 'Mardi · 11:00' }).check();
  await expect(page.getByRole('status').filter({ hasText: 'Séance sélectionnée' })).toContainText(
    'Mardi · 11:00',
  );
  await expect(page.getByText('Exemple fictif · aucune réservation créée')).toBeVisible();
  expect(writes).toBe(0);
  await page.getByRole('link', { name: 'Créer une page comme celle-ci' }).click();
  await expect(page).toHaveURL('/inscription');
});
test('keeps the sales page concise with simple offers and no repeated photo or savings simulator', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Quand Pro devient-il intéressant ?' }),
  ).toHaveCount(0);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(page.locator('.marketing-stage-photo, .marketing-price-float')).toHaveCount(0);
  for (const card of await page.locator('.commercial-plan-card').all())
    expect(await card.evaluate((element) => getComputedStyle(element, '::after').content)).toBe(
      'none',
    );
});
test('keeps SEO content and essential navigation available without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page
      .getByRole('link', { name: 'Choisir Studio Pro — 29 € par mois ou 260 € par an' })
      .click();
    await expect(page).toHaveURL('/inscription?formule=pro');
    await page.goto('/');
    await page.locator('.commercial-comparison > summary').click();
    await expect(page.getByText('Widget pour votre site', { exact: true })).toBeVisible();
    await page.getByRole('contentinfo').getByRole('link', { name: 'Mentions légales' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales');
  } finally {
    await context.close();
  }
});
