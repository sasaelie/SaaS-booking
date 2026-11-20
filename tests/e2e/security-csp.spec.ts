import { expect, test } from '@playwright/test';
test('uses a fresh nonspoofable nonce per HTML request while keeping framework scripts functional', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'x-csp-nonce': 'attacker-controlled' });
  const first = await page.goto('/connexion');
  const policy = first?.headers()['content-security-policy'] ?? '';
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  expect(nonce).not.toBe('attacker-controlled');
  await expect(page.getByLabel('Adresse e-mail', { exact: true })).toBeVisible();
  const nonces = await page
    .locator('script[src*="/_next/"]')
    .evaluateAll((elements) => elements.map((e) => (e as HTMLScriptElement).nonce));
  expect(nonces.length).toBeGreaterThan(0);
  expect(nonces.every((value) => value === nonce)).toBe(true);
  const second = await page.goto('/connexion');
  expect(second?.headers()['content-security-policy']).not.toContain(`'nonce-${nonce}'`);
  expect(second?.headers()['permissions-policy']).toContain('camera=()');
});
test('blocks injected inline scripts and unsafe framing rather than executing them', async ({
  page,
}) => {
  await page.route('**/contact', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      '</body>',
      '<script>window.securityProbe=true</script></body>',
    );
    await route.fulfill({ response, body: html });
  });
  const response = await page.goto('/contact');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response?.headers()['x-frame-options']).toBe('DENY');
  expect(await page.evaluate(() => Reflect.get(window, 'securityProbe'))).toBeUndefined();
  await expect(
    page.getByRole('heading', { name: 'Parlons de votre activité.', exact: true }),
  ).toBeVisible();
});
