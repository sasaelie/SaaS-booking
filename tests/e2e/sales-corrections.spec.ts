import { expect, test } from '@playwright/test';
import { noHorizontalOverflow } from './portal-fixtures';
test('keeps the opaque header across the full viewport while the page scrolls beneath it', async ({
  page,
}, info) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header).toHaveCSS('background-color', /^rgb\(/);
    await expect(header).toHaveCSS('backdrop-filter', 'none');
    await expect(header).not.toHaveCSS('box-shadow', 'none');
    expect((await header.boundingBox())?.x).toBe(0);
    expect((await header.boundingBox())?.width).toBe(width);
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    expect((await header.boundingBox())?.y).toBe(0);
    await noHorizontalOverflow(page);
    if (width === 390)
      await page.screenshot({
        path: info.outputPath('footer-and-opaque-header.png'),
        fullPage: true,
      });
  }
});
test('removes redundant sales blocks and opens the dedicated FAQ from aligned footer links', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Les bons outils, au même endroit.' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', {
        name: 'Votre prochaine activité mérite mieux qu’un fil de messages.',
      }),
    ).toHaveCount(0);
    await expect(page.locator('.marketing-faq-list')).toHaveCount(0);
    const navigation = page.getByRole('contentinfo').getByRole('navigation');
    for (const nav of await navigation.all()) {
      const rightEdges = await nav
        .locator('a .ice-icon')
        .evaluateAll((icons) => icons.map((icon) => icon.getBoundingClientRect().right));
      expect(Math.max(...rightEdges) - Math.min(...rightEdges)).toBeLessThan(1);
    }
  }
  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'FAQ', exact: true })
    .click();
  await expect(page).toHaveURL('/faq');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Questions fréquentes');
  await page.getByText('Mes participants doivent-ils créer un compte ?', { exact: true }).click();
  await expect(page.getByText('Non. Ils ouvrent votre lien', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à l’accueil', exact: true }).click();
  await expect(page).toHaveURL('/');
});
