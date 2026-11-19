import { expect, test, type FrameLocator } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import { externalWebsite, completeEmbeddedBooking, assertEmbedFits } from './embed-fixtures';
import { addAuditActivity } from './action-audit-fixtures';
import { SHARE_UI, UI_MESSAGES, EMBED } from '../../src/config/constants';
import { PARTICIPANT_NAV } from '../../src/config/participant-navigation';
test.afterAll(closeBrowserDatabase);
test('embeds all published courses and completes a reservation without leaving the host website', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  await addAuditActivity(space, 'Broderie découverte');
  const site = await externalWebsite({ slug: space.slug }, 'inline', baseURL);
  try {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(site.url);
    const frame = page.frameLocator('iframe');
    await expect(
      frame.getByRole('heading', { name: SHARE_UI.CATALOG_TITLE, exact: true }),
    ).toBeVisible();
    await expect(frame.locator('article')).toHaveCount(2);
    await chooseCourse(frame);
    await expect(frame.getByRole('heading', { level: 1 })).toContainText('céramique');
    await frame
      .getByRole('link', { name: PARTICIPANT_NAV.RETURN_ACTIVITIES, exact: false })
      .click();
    await expect(frame.locator('article')).toHaveCount(2);
    await chooseCourse(frame);
    await completeEmbeddedBooking(page);
    await expect(
      frame.getByRole('status').filter({ hasText: 'Votre place est réservée.' }),
    ).toBeVisible();
    expect(page.url()).toBe(site.url + '/');
    await assertEmbeddedBooking(space);
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: info.outputPath('embedded-catalog-confirmation.png'),
      fullPage: true,
    });
  } finally {
    await site.close();
  }
});
test('keeps the one-time installation current when the organizer publishes or archives a course', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  const site = await externalWebsite({ slug: space.slug }, 'inline', baseURL);
  try {
    await page.goto(site.url);
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('article')).toHaveCount(1);
    const added = await addAuditActivity(space, 'Nouveau cours publié');
    await page.reload();
    await expect(frame.locator('article')).toHaveCount(2);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noHorizontalOverflow(page);
      await assertEmbedFits(page);
      expect(await frame.locator('html').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`embedded-catalog-${width}.png`),
        fullPage: true,
      });
    }
    await browserDatabase().query('UPDATE activities SET is_active=false WHERE id=$1', [
      added.activityId,
    ]);
    await page.reload();
    await expect(frame.locator('article')).toHaveCount(1);
    await expect(frame.getByText('Nouveau cours publié', { exact: true })).toHaveCount(0);
  } finally {
    await site.close();
  }
});
test('enforces the same Pro entitlement for the catalog and individual course and refuses a foreign course', async ({
  page,
  baseURL,
}) => {
  const space = await browserSpace(),
    other = await browserSpace();
  await page.goto(`/embed/${space.slug}/${other.activityId}`);
  await expect(page.getByText(UI_MESSAGES.UNAVAILABLE, { exact: true })).toBeVisible();
  await browserDatabase().query(
    'UPDATE organization_access SET complimentary=false WHERE organization_id=$1',
    [space.organizationId],
  );
  for (const path of [`/embed/${space.slug}`, `/embed/${space.slug}/${space.activityId}`]) {
    const response = await page.goto(baseURL + path);
    expect(response?.headers()['x-frame-options']).toBeUndefined();
    await expect(page.getByText(UI_MESSAGES.UNAVAILABLE, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer', exact: true })).toHaveCount(0);
  }
});
test('gives the organizer a single install code for all courses while preserving the direct link', async ({
  page,
  context,
}) => {
  const space = await browserSpace();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await login(page, space);
  await page.goto(`/app/${space.organizationId}/partager`);
  await page.getByRole('tab', { name: SHARE_UI.WEBSITE_MODE, exact: true }).click();
  const section = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: SHARE_UI.WEBSITE, exact: true }) });
  await section.getByRole('button', { name: SHARE_UI.COPY_INSTALL, exact: true }).click();
  const script = await page.evaluate(() => navigator.clipboard.readText());
  expect(script).toContain(`data-organization="${space.slug}"`);
  expect(script).not.toContain('data-activity');
  expect(script).toContain(`/widget.js?v=${EMBED.CATALOG_VERSION}`);
  expect(script).not.toMatch(/bypass|_vercel_share|token|secret/i);
  await page.getByRole('tab', { name: SHARE_UI.SOCIAL_MODE, exact: true }).click();
  await expect(page.locator('.portal-share-code').first()).toContainText('/' + space.slug);
});

async function chooseCourse(frame: FrameLocator) {
  await frame
    .locator('article')
    .filter({ hasText: 'Initiation à la céramique' })
    .getByRole('link', { name: SHARE_UI.CATALOG_OPEN, exact: true })
    .click();
}

async function assertEmbeddedBooking(space: Awaited<ReturnType<typeof browserSpace>>) {
  const saved = await browserDatabase().query(
    'SELECT activity_id,status FROM bookings WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(saved.rows).toEqual([{ activity_id: space.activityId, status: 'CONFIRMED' }]);
}
