import { expect, type Page, type TestInfo } from '@playwright/test';
import { browserSpace, browserDatabase } from './portal-fixtures';
import { assertEmbedFits } from './embed-fixtures';
import { WEBSITE_PREVIEW as W } from '../../src/config/website-preview';
import { DatabaseSchema, DATABASE } from '../../src/config/database';
export async function privatePreviewSpace() {
  const space = await browserSpace();
  const schema = DatabaseSchema.parse(
    (process.env['TEST_DATABASE_SCHEMA'] ?? DATABASE.DEFAULT_SCHEMA) + '_simulation',
  );
  const oldSlug = 'older-preview-' + crypto.randomUUID();
  await browserDatabase().query('UPDATE organizations SET slug=$2 WHERE slug=$1', [
    W.SLUG,
    oldSlug,
  ]);
  await browserDatabase().query(`UPDATE "${schema}".organizations SET slug=$2 WHERE slug=$1`, [
    W.SLUG,
    oldSlug,
  ]);
  await browserDatabase().query('UPDATE organizations SET name=$2,slug=$3 WHERE id=$1', [
    space.organizationId,
    'StudioCreatif360',
    W.SLUG,
  ]);
  await browserDatabase().query(
    'UPDATE activities SET name=$2,description=$3,price_cents=0 WHERE id=$1',
    [
      space.activityId,
      'Couture débutant',
      'Un atelier pour découvrir les bases de la couture, à votre rythme.',
    ],
  );
  return { ...space, slug: W.SLUG };
}
export async function assertOnlyTestBooking(organizationId: string) {
  const schema = DatabaseSchema.parse(
    (process.env['TEST_DATABASE_SCHEMA'] ?? DATABASE.DEFAULT_SCHEMA) + '_simulation',
  );
  const live = await browserDatabase().query(
    'SELECT count(*)::int AS count FROM bookings WHERE organization_id=$1',
    [organizationId],
  );
  const simulated = await browserDatabase().query(
    `SELECT status FROM "${schema}".bookings WHERE organization_id=$1`,
    [organizationId],
  );
  expect(live.rows[0].count).toBe(0);
  expect(simulated.rows).toEqual([{ status: 'CONFIRMED' }]);
}
export async function choosePrivatePreviewCourse(page: Page) {
  const frame = page.frameLocator('#studio-booking-preview');
  await frame.getByRole('link', { name: 'Choisir une séance', exact: true }).click();
  await expect(frame.getByRole('heading', { level: 1 })).toContainText('Couture débutant');
}

export async function capturePrivatePreview(page: Page, info: TestInfo, name: string) {
  await page.frameLocator('iframe').locator('[data-page-loading]').waitFor({ state: 'hidden' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await assertEmbedFits(page);
  await page.screenshot({ path: info.outputPath(name + '.png'), fullPage: true });
}
export async function assertPrivateFrameDenied(page: Page, path: string) {
  const response = await page.request.get(path);
  const document = await response.text();
  expect(document).toContain('NEXT_HTTP_ERROR_FALLBACK;404');
  expect(document).not.toContain('Couture débutant');
  expect(document).not.toContain('ice-booking-flow');
}
export async function assertNoPreviewCopy(organizationId: string) {
  const schema = DatabaseSchema.parse(
    (process.env['TEST_DATABASE_SCHEMA'] ?? DATABASE.DEFAULT_SCHEMA) + '_simulation',
  );
  const result = await browserDatabase().query(
    `SELECT count(*)::int AS count FROM "${schema}".organizations WHERE id=$1`,
    [organizationId],
  );
  expect(result.rows[0].count).toBe(0);
}
