import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
import {
  externalWebsite,
  completeEmbeddedBooking,
  assertEmbedFits,
  saveEmbeddedTicket,
} from './embed-fixtures';
import {
  privatePreviewSpace,
  choosePrivatePreviewCourse,
  assertOnlyTestBooking,
} from './private-site-preview-fixtures';
import { EMBED } from '../../src/config/constants';
import { WEBSITE_PREVIEW as W } from '../../src/config/website-preview';
test.afterAll(closeBrowserDatabase);

async function openManagement(page: Page) {
  const frame = page.frameLocator('iframe');
  const code = await frame
    .getByRole('textbox', { name: 'Votre code de réservation', exact: true })
    .inputValue();
  await assertEmbedFits(page);
  await frame.getByRole('button', { name: 'Gérer ma réservation', exact: true }).click();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Gérer ma réservation');
  await expect(
    frame.getByRole('textbox', { name: 'Votre code de réservation', exact: true }),
  ).toHaveValue(code);
  await expect(frame.locator('form form')).toHaveCount(0);
  await expect(
    frame.getByRole('link', { name: /Retour à la connexion|Retour à l’activité/ }),
  ).toHaveCount(0);
  expect(page.context().pages()).toHaveLength(1);
  return code;
}

test('keeps booking, management, the same ticket and finishing on the original external website', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  const site = await externalWebsite(space, 'inline', baseURL);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(site.url);
    await completeEmbeddedBooking(page);
    const code = await openManagement(page);
    await saveEmbeddedTicket(page);
    await assertEmbedFits(page);
    await noHorizontalOverflow(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath('management-within-website.png'),
      fullPage: true,
    });
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: EMBED.RETURN_TICKET, exact: true }).click();
    await expect(
      frame.getByRole('textbox', { name: 'Votre code de réservation', exact: true }),
    ).toHaveValue(code);
    await frame.getByRole('button', { name: EMBED.RETURN_SITE, exact: true }).click();
    await expect(page).toHaveURL(site.url);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(page.context().pages()).toHaveLength(1);
    const bookings = await browserDatabase().query(
      'SELECT status FROM bookings WHERE organization_id=$1',
      [space.organizationId],
    );
    expect(bookings.rows).toEqual([{ status: 'CONFIRMED' }]);
  } finally {
    await site.close();
  }
});

test('cancels inline without resubmitting, reflects cancellation on return and closes the floating window safely', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw Error('Base URL required');
  const space = await browserSpace();
  const site = await externalWebsite(space, 'floating', baseURL);
  try {
    await page.goto(site.url);
    await page.getByRole('button', { name: 'Réserver', exact: true }).click();
    await completeEmbeddedBooking(page);
    await openManagement(page);
    const frame = page.frameLocator('iframe');
    await frame.getByText('Annuler cette réservation', { exact: true }).click();
    await frame.locator('.manage-cancel input[type=checkbox]').check();
    await frame.locator('.manage-cancel button').click();
    await expect(
      frame.getByRole('status').filter({ hasText: 'Votre réservation a été annulée.' }),
    ).toBeVisible();
    await frame.getByRole('button', { name: EMBED.RETURN_TICKET, exact: true }).click();
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(
      'Votre réservation a été annulée.',
    );
    await expect(frame.getByText('Votre place vous attend.', { exact: true })).toHaveCount(0);
    await page.evaluate((type) => window.postMessage({ type }, location.origin), EMBED.RETURN_TYPE);
    await expect(page.getByRole('dialog')).toBeVisible();
    await frame.getByRole('button', { name: EMBED.RETURN_SITE, exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Réserver', exact: true })).toBeFocused();
    await expect(page).toHaveURL(site.url);
    const bookings = await browserDatabase().query(
      'SELECT status FROM bookings WHERE organization_id=$1',
      [space.organizationId],
    );
    expect(bookings.rows).toEqual([{ status: 'CANCELLED_BY_ATTENDEE' }]);
  } finally {
    await site.close();
  }
});

test('keeps the private Studio preview and its TEST ticket inside the organizer website throughout management and finishing', async ({
  page,
}, info) => {
  const space = await privatePreviewSpace();
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, space);
  await page.goto(W.PATH);
  await choosePrivatePreviewCourse(page);
  await completeEmbeddedBooking(page);
  await openManagement(page);
  await assertOnlyTestBooking(space.organizationId);
  await saveEmbeddedTicket(page, 'billet-reservation-test.pdf');
  await assertEmbedFits(page);
  await noHorizontalOverflow(page);
  const audit = await new AxeBuilder({ page }).include('main').analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath('private-management-within-site.png'),
    fullPage: true,
  });
  await page
    .frameLocator('iframe')
    .getByRole('button', { name: EMBED.RETURN_SITE, exact: true })
    .click();
  await expect(page).toHaveURL(W.PATH);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.getByRole('link', { name: 'Studio Créatif 360 — accueil' }).first(),
  ).toBeFocused();
  expect(page.context().pages()).toHaveLength(1);
});
