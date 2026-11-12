import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './portal-fixtures';
test('has no detected WCAG A/AA violations in visible home, expanded comparison and preview states', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/#contenu');
  await page.locator('.commercial-comparison > summary').click();
  for (const label of ['Ateliers', 'Soins', 'Sport']) {
    await page
      .getByRole('group', { name: 'Explorer un exemple d’activité' })
      .getByRole('radio', { name: label, exact: true })
      .check();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    await info.attach(`accessibilite-${label}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map(({ target }) => target),
      })),
    ).toEqual([]);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await noHorizontalOverflow(page);
});
test('links to real informational pages with a useful return path and no placeholder links', async ({
  page,
}) => {
  for (const [label, path] of [
    ['Mentions légales', '/mentions-legales'],
    ['Confidentialité', '/confidentialite'],
    ['Conditions d’utilisation', '/conditions'],
    ['Accessibilité', '/accessibilite'],
    ['Contact', '/contact'],
  ] as const) {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 900 });
    await noHorizontalOverflow(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map(({ id }) => id)).toEqual([]);
    await page.getByRole('link', { name: 'Retour à l’accueil', exact: true }).click();
    await expect(page).toHaveURL('/');
  }
});
