import { expect, test } from '@playwright/test';
import { browserSpace, closeBrowserDatabase, login, noHorizontalOverflow } from './portal-fixtures';
import { administrationVolume, operationVolume } from './administration-fixtures';
test.afterAll(closeBrowserDatabase);
test('paginates 126 organizations on the server, preserves filters and searches by owner email', async ({
  page,
}, info) => {
  const space = await administrationVolume();
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page, space);
  await page.goto(`/plateforme?search=${space.prefix}&pageSize=50&sort=newest`);
  await expect(page.locator('.administration-organizations article')).toHaveCount(50);
  await expect(page.getByRole('navigation', { name: 'Page', exact: true })).toContainText(
    '126 résultat(s)',
  );
  await page.getByRole('link', { name: 'Suivant', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByLabel('Nom ou lien de l’organisation', { exact: true })).toHaveValue(
    space.prefix,
  );
  await expect(page.locator('.administration-organizations article')).toHaveCount(50);
  await page.getByRole('link', { name: 'Suivant', exact: true }).click();
  await expect(page.locator('.administration-organizations article')).toHaveCount(26);
  await page.goto(
    `/plateforme?search=${encodeURIComponent(space.actor.email)}&status=COMPLIMENTARY&pageSize=50`,
  );
  await expect(page.locator('.administration-organizations article')).toHaveCount(32);
  await expect(
    page.locator('.administration-organizations article .status-badge').first(),
  ).toHaveAttribute('data-tone', 'green');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`organizations-${width}.png`), fullPage: true });
  }
});
test('filters and paginates operations with status colors and no exposed job payload', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await operationVolume(space.organizationId);
  await login(page, space);
  await page.goto(
    `/plateforme/operations?search=${space.slug}&status=RETRY&type=CONFIRMATION&pageSize=25&sort=oldest`,
  );
  await expect(page.locator('.administration-compact-row')).toHaveCount(25);
  await expect(page.locator('.administration-compact-row .status-badge').first()).toHaveAttribute(
    'data-tone',
    'red',
  );
  await page.getByRole('link', { name: 'Suivant', exact: true }).click();
  await expect(page).toHaveURL(/status=RETRY/);
  await expect(page).toHaveURL(/type=CONFIRMATION/);
  await expect(page.locator('.administration-compact-row')).toHaveCount(25);
  expect(await page.locator('main').textContent()).not.toContain('never-render-secret');
  await page.locator('.administration-compact-row summary').first().click();
  await expect(
    page.getByText('Un service doit être configuré.', { exact: true }).first(),
  ).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`operations-${width}.png`), fullPage: true });
  }
});
