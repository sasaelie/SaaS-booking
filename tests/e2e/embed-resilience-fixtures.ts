import { expect, type BrowserContext, type Page } from '@playwright/test';
import { browserDatabase, browserSpace } from './portal-fixtures';
import { saveEmbeddedTicket } from './embed-fixtures';
import { EMBED } from '../../src/config/constants';
declare global {
  interface Window {
    bookingEmbedMessages: unknown[];
  }
}
export async function denyEmbeddedStorage(context: BrowserContext, provider: string) {
  await context.route(provider + '/**', async (route) => {
    const headers = route.request().headers();
    delete headers['cookie'];
    const response = await route.fetch({ headers, maxRedirects: 0 });
    const output = response.headers();
    delete output['set-cookie'];
    await route.fulfill({ response, headers: output });
  });
  await context.addInitScript(() => {
    for (const name of ['localStorage', 'sessionStorage'])
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          throw new DOMException('Storage refused', 'SecurityError');
        },
      });
    Object.defineProperty(Document.prototype, 'cookie', {
      configurable: true,
      get() {
        return '';
      },
      set(_value: string) {},
    });
    window.bookingEmbedMessages = [];
    window.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (
        event.data &&
        typeof event.data === 'object' &&
        'type' in event.data &&
        typeof event.data.type === 'string' &&
        event.data.type.startsWith('booking-widget:')
      )
        window.bookingEmbedMessages.push(event.data);
    });
  });
}
export async function finishCookieFreeBooking(
  page: Page,
  space: Awaited<ReturnType<typeof browserSpace>>,
) {
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Gérer ma réservation', exact: true }).click();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Gérer ma réservation');
  await saveEmbeddedTicket(page);
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
  const saved = await browserDatabase().query(
    'SELECT status FROM bookings WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(saved.rows).toEqual([{ status: 'CANCELLED_BY_ATTENDEE' }]);
}
export async function assertPublicEmbedMessages(page: Page) {
  const messages = await page.evaluate(() => window.bookingEmbedMessages);
  expect(messages.length).toBeGreaterThan(0);
  for (const message of messages) {
    expect(typeof message).toBe('object');
    expect(
      Object.keys(message as object).every((key) =>
        ['type', 'version', 'status', 'height'].includes(key),
      ),
    ).toBe(true);
  }
}
