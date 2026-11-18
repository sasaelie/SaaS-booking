import { expect, test } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  browserDatabase,
  browserUser,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { administrationFinance, issuer } from './administration-fixtures';
test.afterAll(closeBrowserDatabase);
test('separates platform revenues from organizer funds and exports the actual signed entries', async ({
  page,
}, info) => {
  const space = await administrationFinance();
  await login(page, space);
  await page.goto(`/plateforme/finances?search=${space.slug}`);
  await expect(page.locator('.administration-finance-summary')).toContainText('29,40');
  const csv = await page.request.get(`/api/plateforme/export?search=${space.slug}&format=csv`);
  expect(csv.ok()).toBe(true);
  const text = await csv.text();
  expect(text).toContain('Commission plateforme');
  expect(text).toContain('"150"');
  expect(text).toContain('"-40"');
  expect(text).toContain('"-70"');
  const xlsx = await page.request.get(`/api/plateforme/export?search=${space.slug}&format=xlsx`);
  expect(xlsx.ok()).toBe(true);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(await xlsx.body()).buffer);
  expect(workbook.getWorksheet('Journal')?.rowCount).toBe(6);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`finance-${width}.png`), fullPage: true });
  }
});
test('shows global usage from real bookings without exposing participant or organizer identities', async ({
  page,
}, info) => {
  const space = await administrationFinance();
  await login(page, space);
  await page.goto('/plateforme/utilisation');
  await expect(page.locator('.administration-usage-metrics')).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Réservations confirmées au fil des jours', exact: true }),
  ).toBeVisible();
  const text = await page.locator('main').textContent();
  expect(text).not.toContain(space.actor.email);
  expect(text).not.toContain('alex@example.com');
  await page.getByText('Voir les chiffres jour par jour', { exact: true }).click();
  await expect(page.locator('.administration-usage-table tbody tr')).toHaveCount(30);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`usage-${width}.png`), fullPage: true });
  }
});
test('refuses global reports, exports and billing configuration to ordinary organizers', async ({
  page,
}) => {
  const user = await browserUser();
  await login(page, user);
  for (const path of ['/plateforme/finances', '/plateforme/utilisation']) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', {
        name: 'Cet espace est réservé aux administrateurs de la plateforme.',
        exact: true,
      }),
    ).toBeVisible();
  }
  expect((await page.request.get('/api/plateforme/export')).ok()).toBe(false);
  const before = await browserDatabase().query('SELECT profile FROM platform_billing_settings');
  expect(
    (
      await page.request.post('/api/plateforme/billing', {
        headers: { Origin: new URL(page.url()).origin },
        data: { action: 'settings', input: issuer },
      })
    ).ok(),
  ).toBe(false);
  const after = await browserDatabase().query('SELECT profile FROM platform_billing_settings');
  expect(after.rows).toEqual(before.rows);
});
