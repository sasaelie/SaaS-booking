import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { ADMIN_SECURITY as C } from '../../src/config/administrator-security';
import {
  browserUser,
  login,
  closeBrowserDatabase,
  noHorizontalOverflow,
  browserDatabase,
} from './portal-fixtures';
import {
  prepareDevice,
  activateDevice,
  verifyDevice,
  securityPost,
  setVerificationAge,
  watchAssertion,
} from './administrator-security-helpers';
test.afterAll(closeBrowserDatabase);
test('enrolls and verifies an actual WebAuthn platform credential on one mobile screen, preserves glass and saves recovery codes', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const prepared = await prepareDevice(page);
  await expect(page.locator('.administrator-security-panel>.status-badge')).toHaveText(C.PENDING);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: C.SAVE_CODES, exact: true }).click();
  const path = await (await download).path();
  expect(await readFile(path, 'utf8')).toContain(prepared.codes[0]);
  await expect(page.locator('.administrator-security img')).toHaveCount(0);
  const form = page.getByRole('form', { name: C.ACTIVATE, exact: true });
  await form.getByLabel(C.CODE_CONFIRM).fill(prepared.codes[0] ?? '');
  await form.getByRole('button', { name: C.ACTIVATE, exact: true }).click();
  await expect(page.locator('.administrator-security-panel>.status-badge')).toHaveText(C.ACTIVE);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('[data-page-loading]').waitFor({ state: 'hidden' });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`administrator-security-${width}.png`) });
  }
  const audit = await new AxeBuilder({ page }).include('main').analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  const options = await browserDatabase().query(
    'SELECT public_key FROM administrator_passkeys WHERE user_id=$1',
    [prepared.user.actor.id],
  );
  expect(options.rows[0].public_key.length).toBeGreaterThan(20);
});
test('requires the device again after a password login and blocks direct administrator exports until verification', async ({
  page,
}) => {
  const { user } = await activateDevice(page);
  await page.context().clearCookies();
  await login(page, user);
  await page.goto('/plateforme');
  await expect(page).toHaveURL(new RegExp(C.PATH));
  expect((await page.request.get('/api/plateforme/export')).status()).toBe(403);
  const denied = await securityPost(page, { action: 'disable', password: user.password });
  expect((await denied.json()).code).toBe('MFA_REQUIRED');
  await verifyDevice(page);
  expect((await page.request.get('/api/plateforme/export')).status()).toBe(200);
  await expect(page.getByRole('link', { name: C.BACK, exact: true })).toBeVisible();
});
test('uses a recovery code without a camera or second device and refuses using it a second time', async ({
  page,
  browser,
}) => {
  const { user, codes } = await activateDevice(page);
  const context = await browser.newContext({ baseURL: new URL(page.url()).origin }),
    other = await context.newPage();
  try {
    await login(other, user);
    await other.goto('/plateforme');
    await other.locator('summary').filter({hasText:C.RECOVER}).click();
    const form = other.getByRole('form', { name: C.RECOVER, exact: true });
    await form.getByLabel(C.CODE, { exact: true }).fill(codes[0] ?? '');
    await form.getByRole('button', { name: C.RECOVER, exact: true }).click();
    await expect(other.getByRole('link', { name: C.BACK, exact: true })).toBeVisible();
    expect((await securityPost(other, { action: 'recover', code: codes[0] })).status()).toBe(400);
    expect(
      (
        await browserDatabase().query(
          'SELECT count(*)::int AS count FROM administrator_recovery_codes WHERE user_id=$1',
          [user.actor.id],
        )
      ).rows[0].count,
    ).toBe(9);
  } finally {
    await context.close();
  }
});
test('refuses hostile origins, ordinary accounts and a wrong password and allows cancelling setup without enabling protection', async ({
  page,
}) => {
  const user = await browserUser(true);
  await login(page, user);
  await page.goto(C.PATH);
  const data = { action: 'register-options', password: user.password, label: 'Téléphone' };
  expect((await securityPost(page, data, 'https://attacker.invalid')).status()).toBe(403);
  expect((await securityPost(page, { ...data, password: 'wrong-password' })).status()).toBe(400);
  expect(
    (
      await browserDatabase().query('SELECT 1 FROM administrator_passkeys WHERE user_id=$1', [
        user.actor.id,
      ])
    ).rowCount,
  ).toBe(0);
  const form = page.getByRole('form', { name: C.SETUP, exact: true });
  await form.getByLabel(C.PASSWORD, { exact: true }).fill(user.password);
  await form.getByRole('button', { name: C.SETUP, exact: true }).click();
  await page.getByRole('button', { name: C.CANCEL, exact: true }).click();
  await expect(page.locator('.administrator-security-panel>.status-badge')).toHaveText(C.INACTIVE);
  await page.context().clearCookies();
  await login(page, await browserUser(false));
  expect((await securityPost(page, data)).status()).toBe(400);
  await page.goto(C.PATH);
  await expect(page.getByRole('button', { name: C.SETUP, exact: true })).toHaveCount(0);
});
test('rejects replayed assertions, demands fresh verification for management and protects the last active key', async ({
  page,
}) => {
  const { user } = await activateDevice(page);
  const assertion = watchAssertion(page);
  await verifyDevice(page);
  expect(assertion()).toBeTruthy();
  expect((await securityPost(page, assertion())).status()).toBe(400);
  const key = (
    await browserDatabase().query(
      'SELECT credential_id FROM administrator_passkeys WHERE user_id=$1',
      [user.actor.id],
    )
  ).rows[0].credential_id;
  expect(
    (
      await securityPost(page, { action: 'remove', credentialId: key, password: user.password })
    ).status(),
  ).toBe(400);
  await setVerificationAge(user.actor.id, 6);
  expect(
    (
      await (
        await securityPost(page, { action: 'rotate-recovery', password: user.password })
      ).json()
    ).code,
  ).toBe('MFA_REQUIRED');
  await verifyDevice(page);
  expect(
    (await securityPost(page, { action: 'rotate-recovery', password: user.password })).ok(),
  ).toBe(true);
});
