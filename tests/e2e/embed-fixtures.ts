import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, type Page } from '@playwright/test';
import { EMBED } from '../../src/config/constants';
export async function externalWebsite(
  space: { slug: string; activityId?: string },
  mode: 'inline' | 'floating',
  provider: string,
) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site de l’association</title></head><body style="margin:0;background:#f7f5f0;font-family:system-ui"><header style="padding:24px"><h1>Les ateliers de notre association</h1><p>Réservez directement depuis notre site.</p></header><script src="${provider}/widget.js${space.activityId ? '' : '?v=' + EMBED.CATALOG_VERSION}" data-organization="${space.slug}" ${space.activityId ? `data-activity="${space.activityId}"` : ''} data-mode="${mode}" defer></script></body></html>`,
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
export async function completeEmbeddedBooking(page: Page) {
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Continuer', exact: true }).click();
  await frame.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Marie');
  await frame.getByRole('textbox', { name: 'Nom', exact: true }).fill('Essai');
  await frame
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill(`embed-${crypto.randomUUID()}@example.com`);
  await frame.getByRole('checkbox', { name: /Je certifie/ }).check();
  await frame.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await frame.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
}

export async function assertEmbedFits(page: Page) {
  await expect
    .poll(async () => {
      const outer = await page.locator('iframe').evaluate((e) => e.getBoundingClientRect().height);
      const inner = await page
        .frameLocator('iframe')
        .locator('body')
        .evaluate((e) => e.getBoundingClientRect().height);
      return outer >= Math.ceil(inner);
    })
    .toBe(true);
}
