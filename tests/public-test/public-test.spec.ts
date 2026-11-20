import { test, expect } from '@playwright/test';
import {
  externalWebsite,
  completeEmbeddedBooking,
  saveEmbeddedTicket,
} from '../e2e/embed-fixtures';
import {
  SHARE_UI,
  EMBED,
  FORM_LABELS,
  PARTICIPANT_UI,
  BOOKING_UI,
} from '../../src/config/constants';
import { PUBLIC_TEST } from '../../src/config/public-test';
const slug = process.env['PUBLIC_TEST_ORGANIZATION_SLUG'] ?? 'studio-demo';
test('calendar commands stay disabled until JavaScript initializes the selected session', async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/**/*.js', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    const activity = await page.request.get(`/embed/${slug}`);
    const href = (await activity.text()).match(
      new RegExp(`href="(/embed/${slug}/[0-9a-f-]{36})"`),
    )?.[1];
    expect(href).toBeTruthy();
    if (!href) throw Error('Published activity required');
    await page.goto(href, { waitUntil: 'commit' });
    const next = page.getByRole('button', { name: 'Continuer', exact: true });
    await expect(next).toBeDisabled();
    release();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByRole('textbox', { name: 'Prénom', exact: true })).toBeVisible();
  } finally {
    release();
  }
});
for (const mode of ['inline', 'floating'] as const) {
  test(`anonymous public TEST booking stays in the host site (${mode})`, async ({
    page,
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw Error('Public TEST URL required');
    const site = await externalWebsite({ slug }, mode, baseURL);
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(site.url);
      if (mode === 'floating')
        await page.getByRole('button', { name: SHARE_UI.BUTTON, exact: true }).click();
      const frame = page.frameLocator('iframe');
      await expect(frame.getByText(/Démonstration publique TEST/)).toBeVisible();
      const selectedName = await frame.locator('.catalog-activity h2').first().textContent();
      await expect(frame.locator('.catalog-price').first()).toContainText('20,00');
      await frame.getByRole('link', { name: SHARE_UI.CATALOG_OPEN }).first().click();
      await expect(frame.getByRole('heading', { level: 1 })).toHaveText(selectedName ?? '');
      await completeEmbeddedBooking(page, BOOKING_UI.PAY);
      await expect(frame.locator('.participant-ticket')).toBeVisible();
      await expect(frame.locator('.participant-ticket h2')).toHaveText(selectedName ?? '');
      await expect(frame.locator('.ticket-money>div').first()).toContainText('20,00');
      await expect(frame.getByRole('status').first()).toHaveText(PUBLIC_TEST.PAYMENT_SUCCESS);
      await expect(frame.locator('.ticket-money>div').nth(1)).toContainText('20,00');
      await expect(frame.locator('.ticket-money')).not.toContainText(PARTICIPANT_UI.DUE_TEST);
      const code = await frame.locator('.ticket-code textarea').inputValue();
      expect(code?.replaceAll(/\s/g, '')).toMatch(/^TEST-/);
      await saveEmbeddedTicket(page, 'billet-reservation-test.pdf');
      await frame.getByRole('button', { name: FORM_LABELS.MANAGE, exact: true }).click();
      await expect(frame.getByRole('heading', { name: FORM_LABELS.MANAGE })).toBeVisible();
      await frame.getByRole('button', { name: EMBED.RETURN_SITE, exact: true }).click();
      await expect(page).toHaveURL(site.url);
      if (mode === 'floating') await expect(page.getByRole('dialog')).not.toBeVisible();
      await freshCodeAccess(browser, baseURL, code ?? '');
    } finally {
      await site.close();
    }
  });
}
async function freshCodeAccess(
  browser: import('@playwright/test').Browser,
  baseURL: string,
  code: string,
) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/connexion`);
    await expect(page.getByRole('link', { name: 'Organisateur', exact: true })).toHaveCount(0);
    await page
      .getByRole('textbox', { name: 'Votre code de réservation' })
      .fill(code.replaceAll(/\s/g, ''));
    await page.getByRole('button', { name: 'Retrouver ma réservation', exact: true }).click();
    await expect(page.locator('.participant-ticket')).toBeVisible();
    await expect(page.locator('.ticket-test')).toBeVisible();
  } finally {
    await context.close();
  }
}
test('private routes, other tenants and email recovery are unavailable on the public host', async ({
  request,
}) => {
  for (const path of [
    '/app',
    '/plateforme',
    '/apercu-site',
    '/api/auth/get-session',
    '/api/portal/activities',
    '/api/jobs',
    '/api/participant/recover',
    '/another-org',
    '/embed/another-org',
  ])
    expect((await request.get(path)).status()).toBe(404);
  for (const path of [
    '/api/auth/sign-up/email',
    '/api/jobs',
    '/api/portal/activities',
    '/api/participant/recover',
  ])
    expect((await request.post(path, { data: {} })).status()).toBe(404);
  expect(
    (await request.post('/api/participant/exchange', { data: { code: 'TEST-INVALID' } })).ok(),
  ).toBe(false);
});
