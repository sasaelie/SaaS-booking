import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { alignedFields, separatedPanels } from './layout-assertions';
test.afterAll(closeBrowserDatabase);
test('aligns and styles the credit and cost fields consistently at four widths', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/app/${space.organizationId}/abonnement`);
    await page.getByText('Valider un report pour un cours en ligne', { exact: true }).click();
    const credit = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Valider le report', exact: true }) });
    await alignedFields(credit);
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`after-billing-${width}.png`), fullPage: true });
    await page.goto(`/plateforme?search=${space.slug}`);
    await page.getByText('Rapprocher un coût exceptionnel réel', { exact: true }).click();
    const cost = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Enregistrer le coût', exact: true }) });
    await alignedFields(cost);
    await expect(page.getByLabel('Espace concerné', { exact: true })).toBeVisible();
    await separatedPanels(page.locator('main'));
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`after-cost-${width}.png`), fullPage: true });
  }
});
test('keeps activity cards separated and aligned with a long heading and a clear attendee action', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await browserDatabase().query('UPDATE activities SET name=$2 WHERE id=$1', [
    space.activityId,
    'Les rencontres créatives — Initiation à la céramique et créations partagées',
  ]);
  await login(page, space);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/app/${space.organizationId}/activites/${space.activityId}`);
    await separatedPanels(page.locator('main'));
    const summary = page.locator('.portal-activity-summary');
    await expect(
      summary.getByRole('link', { name: 'Voir les inscrits', exact: true }),
    ).toBeVisible();
    await noHorizontalOverflow(page);
    const h = await page.locator('.portal-heading').boundingBox();
    const panel = await summary.boundingBox();
    expect(Math.abs((h?.x ?? 0) - (panel?.x ?? 0))).toBeLessThan(1);
    await page.screenshot({ path: info.outputPath(`after-activity-${width}.png`), fullPage: true });
  }
});
test('uses equal entry buttons and adequate compact and secondary touch targets', async ({
  page,
}) => {
  const space = await browserSpace();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const sizes = await page
      .locator('.portal-landing-actions > a')
      .evaluateAll((links) =>
        links.map((el) => ({
          height: el.getBoundingClientRect().height,
          radius: getComputedStyle(el).borderRadius,
        })),
      );
    expect(sizes).toHaveLength(2);
    expect(sizes[0]?.height).toBe(sizes[1]?.height);
    expect(sizes[0]?.radius).toBe(sizes[1]?.radius);
  }
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/activites/${space.activityId}`);
  await page.locator('summary').filter({ hasText: 'Archiver cette activité' }).click();
  expect(
    (await page.getByRole('button', { name: 'Archiver cette activité', exact: true }).boundingBox())
      ?.height,
  ).toBeGreaterThanOrEqual(44);
  expect(
    (await page.getByRole('button', { name: 'Se déconnecter', exact: true }).boundingBox())?.height,
  ).toBeGreaterThanOrEqual(44);
});
