import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { expect, type Page } from '@playwright/test';
import { EMBED } from '../../src/config/constants';
import { EMBED_HEALTH } from '../../src/config/embed-health';
import { embedInstallCode } from '../../src/lib/embed-install-code';
export async function externalWebsite(
  space: { slug: string; activityId?: string },
  mode: 'inline' | 'floating',
  provider: string,
  headers: Readonly<Record<string, string>> = {},
) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
    res.end(
      `<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site de l’association</title></head><body style="margin:0;background:#f7f5f0;font-family:system-ui"><header style="padding:24px"><h1>Les ateliers de notre association</h1><p>Réservez directement depuis notre site.</p></header>${embedInstallCode(provider, space.slug, mode, space.activityId)}</body></html>`,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('Missing server address');
  return {
    url: `http://127.0.0.1:${(address satisfies AddressInfo).port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
export async function completeEmbeddedBooking(page: Page, submitLabel = 'Confirmer ma place') {
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('button', { name: 'Continuer', exact: true })).toBeVisible();
  await assertEmbedFits(page);
  await frame.getByRole('button', { name: 'Continuer', exact: true }).click();
  await frame.getByRole('textbox', { name: /^Prénom(?: du participant mineur)?$/ }).fill('Marie');
  await frame.getByRole('textbox', { name: /^Nom(?: du participant mineur)?$/ }).fill('Essai');
  await frame
    .getByRole('textbox', { name: /^(?:Adresse e-mail|E-mail du représentant légal)$/ })
    .fill(`embed-${crypto.randomUUID()}@example.com`);
  const phone = frame.getByRole('textbox', { name: /Téléphone/ });
  if (await phone.count()) await phone.fill('+32470000000');
  await frame.getByRole('checkbox', { name: /Je certifie/ }).check();
  await frame.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await frame.getByRole('button', { name: submitLabel, exact: true }).click();
}

export async function assertEmbedFits(page: Page) {
  await expect(page.locator('[data-booking-widget]')).toHaveAttribute(
    'data-booking-state',
    'ready',
    { timeout: EMBED_HEALTH.TIMEOUT_MS },
  );
  if (await page.locator('iframe').evaluate((element) => Boolean(element.closest('dialog')))) {
    await assertFloatingViewport(page);
    return;
  }
  await expect
    .poll(async () => {
      const outer = await page.locator('iframe').evaluate((e) => e.getBoundingClientRect().height);
      const inner = await page
        .frameLocator('iframe')
        .locator('body')
        .evaluate((e) => e.getBoundingClientRect().height);
      return Math.abs(outer - Math.max(EMBED.MIN_HEIGHT, Math.ceil(inner))) <= 1;
    })
    .toBe(true);
}
async function assertFloatingViewport(page: Page) {
  await expect
    .poll(() =>
      page.locator('dialog').evaluate((dialog) => {
        if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return false;
        const frame = dialog.querySelector('iframe')?.getBoundingClientRect();
        const close = dialog.querySelector('button')?.getBoundingClientRect();
        const bounds = dialog.getBoundingClientRect();
        return Boolean(
          frame &&
          close &&
          frame.height > 0 &&
          close.height >= 44 &&
          bounds.top >= 0 &&
          bounds.bottom <= window.innerHeight &&
          frame.top >= bounds.top &&
          frame.bottom <= bounds.bottom &&
          close.top >= bounds.top &&
          close.bottom <= bounds.bottom &&
          close.bottom <= frame.top &&
          dialog.scrollHeight <= dialog.clientHeight + 1,
        );
      }),
    )
    .toBe(true);
}

export async function saveEmbeddedTicket(page: Page, filename = 'billet-reservation.pdf') {
  const link = page
    .frameLocator('iframe')
    .getByRole('link', { name: 'Enregistrer le billet PDF', exact: true });
  await expect(link).toBeVisible();
  const event = page.waitForEvent('download');
  await link.click();
  const download = await event;
  expect(download.suggestedFilename()).toBe(filename);
  const path = await download.path();
  if (!path) throw Error('Saved ticket missing');
  expect((await readFile(path)).subarray(0, 4).toString()).toBe('%PDF');
}
