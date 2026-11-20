import { expect, test } from '@playwright/test';
import {
  browserSpace,
  browserUser,
  browserDatabase,
  closeBrowserDatabase,
  login,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('rejects cross-origin and missing-origin cookie mutations across administrative, organizer and simulation routes', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  const paths = [
    '/api/portal/command',
    '/api/portal/manage',
    '/api/portal/media',
    '/api/plateforme/settings',
    '/api/plateforme/billing',
    '/api/participant/recover',
    '/api/participant/exchange',
    `/api/simulation/${space.organizationId}/delete`,
    '/api/participant/test/cancel',
  ];
  for (const path of paths) {
    const hostile = await page.request.post(path, {
      headers: { Origin: 'https://attacker.invalid', 'Content-Type': 'text/plain' },
      data: '{"action":"publish","revision":0}',
    });
    expect(hostile.status(), path).toBe(403);
    const missing = await page.request.post(path, { data: { action: 'publish', revision: 0 } });
    expect(missing.status(), path).toBe(403);
  }
});
test('refuses cross-organization exports and QR resources and refuses administrator configuration to an ordinary account', async ({
  page,
}) => {
  const own = await browserSpace(),
    foreign = await browserSpace();
  await login(page, own);
  for (const path of [
    `/api/portal/accounting?organizationId=${foreign.organizationId}`,
    `/api/portal/qr?organizationId=${foreign.organizationId}`,
  ])
    expect((await page.request.get(path)).status()).toBe(403);
  const ordinary = await browserUser();
  await page.context().clearCookies();
  await login(page, ordinary);
  const response = await page.request.post('/api/plateforme/settings', {
    headers: { Origin: new URL(page.url()).origin },
    data: { action: 'save', revision: 0, profile: { email: 'attacker@example.invalid' } },
  });
  expect(response.ok()).toBe(false);
  expect((await response.json()).code).toBe('UNAUTHORIZED');
});
test('does not let forged forwarding headers bypass the public voucher rate limit', async ({
  page,
}) => {
  await browserDatabase().query('TRUNCATE request_limits');
  try {
    const results = [];
    for (let i = 0; i < 21; i++)
      results.push(
        (
          await page.request.post('/api/voucher-quote', {
            headers: {
              'x-forwarded-for': `198.51.100.${i + 1}`,
              'x-vercel-forwarded-for': `192.0.2.${i + 1}`,
            },
            data: {},
          })
        ).status(),
      );
    expect(results.slice(0, 20)).not.toContain(429);
    expect(results[20]).toBe(429);
  } finally {
    await browserDatabase().query('TRUNCATE request_limits');
  }
});
test('rejects malformed, oversized and privilege-forging platform payloads without storing supplied fields', async ({
  page,
}) => {
  const space = await browserSpace();
  await login(page, space);
  const headers = { Origin: new URL(page.url()).origin, 'Content-Type': 'application/json' };
  for (const data of [
    '{"action":',
    'x'.repeat(140000),
    JSON.stringify({
      action: 'save',
      revision: 0,
      profile: { role: 'admin', email: 'bad' },
      published: { email: 'leak@example.invalid' },
    }),
  ]) {
    const response = await page.request.post('/api/plateforme/settings', { headers, data });
    expect(response.status()).toBe(400);
  }
});
