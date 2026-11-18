import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('prepares private contacts, publishes only saved information and keeps newer drafts hidden', async ({
  page,
  browser,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto('/plateforme/parametres');
  await prepareProfile(page);
  const visitor = await browser.newPage({ baseURL: new URL(page.url()).origin });
  try {
    await visitor.goto('/contact');
    await expect(visitor.locator('main')).not.toContainText('contact-public@example.invalid');
    await page.getByRole('button', { name: 'Publier les coordonnées', exact: true }).click();
    await expect(page.locator('.platform-settings-preview .status-badge')).toHaveText('Publié');
    await visitor.reload();
    await expect(
      visitor.locator('main a[href="mailto:contact-public@example.invalid"]'),
    ).toBeVisible();
    await expect(visitor.locator('main a[href="tel:+32470123456"]')).toBeVisible();
    await page.getByLabel('E-mail public', { exact: true }).fill('draft-secret@example.invalid');
    await page.getByRole('button', { name: 'Enregistrer le brouillon', exact: true }).click();
    await expect(page.locator('.platform-settings-preview .status-badge')).toHaveText(
      'Publié · brouillon modifié',
    );
    await visitor.reload();
    await expect(visitor.locator('main')).not.toContainText('draft-secret@example.invalid');
    await captureSettings(page, info);
    const audit = await new AxeBuilder({ page }).include('main').analyze();
    expect(
      audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  } finally {
    await page.getByRole('button', { name: 'Retirer de la publication', exact: true }).click();
    await visitor.close();
  }
});
test('stores only private Peppol preparation without pretending that a provider is connected', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto('/plateforme/parametres/peppol');
  await page.getByLabel('Prestataire envisagé', { exact: true }).selectOption('BILLIT');
  await page
    .getByLabel('Identifiant de participant Peppol', { exact: true })
    .fill('0208:0123456789');
  await page.getByRole('button', { name: 'Enregistrer la préparation', exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await browserDatabase().query(
            "SELECT connection->>'provider' AS provider FROM platform_settings",
          )
        ).rows[0]?.provider,
    )
    .toBe('BILLIT');
  await expect(page.locator('.platform-peppol-preparation .status-badge')).toHaveText(
    'Transmission non raccordée',
  );
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});
async function captureSettings(
  page: Parameters<typeof noHorizontalOverflow>[0],
  info: { outputPath: (name: string) => string },
) {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('[data-page-loading]').waitFor({ state: 'hidden' });
    await noHorizontalOverflow(page);
    await expect
      .poll(() =>
        page
          .getByRole('navigation', { name: 'Administration', exact: true })
          .getByRole('link', { name: 'Paramètres', exact: true })
          .evaluate((e) => {
            const parent = e.parentElement?.getBoundingClientRect(),
              rect = e.getBoundingClientRect();
            return !!parent && rect.left >= parent.left - 1 && rect.right <= parent.right + 1;
          }),
      )
      .toBe(true);
    await page.screenshot({
      path: info.outputPath(`platform-settings-${width}.png`),
      fullPage: true,
    });
  }
}

async function prepareProfile(page: Parameters<typeof noHorizontalOverflow>[0]) {
  await page
    .getByLabel('Nom ou raison sociale', { exact: true })
    .fill('Entreprise de démonstration');
  await page.getByLabel('E-mail public', { exact: true }).fill('contact-public@example.invalid');
  await page.getByLabel('Téléphone public', { exact: true }).fill('0470 12 34 56');
  await expect(
    page.getByRole('button', { name: 'Publier les coordonnées', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Enregistrer le brouillon', exact: true }).click();
  await expect(page.locator('.platform-settings-preview')).toContainText(
    'contact-public@example.invalid',
  );
}
