import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ADMIN_CODES as C } from '../../src/config/administrator-codes';
import { ADMIN_SECURITY as S } from '../../src/config/administrator-security';
import { closeBrowserDatabase, login, noHorizontalOverflow } from './portal-fixtures';
import {
  codeAccount,
  configureTotp,
  activateCodes,
  enterCode,
  totpValue,
  withoutBiometrics,
} from './administrator-code-helpers';
import { securityPost, activateDevice } from './administrator-security-helpers';
test.afterAll(closeBrowserDatabase);
test('offers three accessible methods without WebAuthn and keeps the manual setup usable on a single phone', async ({
  page,
}, info) => {
  await codeAccount(page);
  await expect(page.getByRole('tab')).toHaveCount(3);
  await page.getByRole('tab', { name: /Biométrie/ }).click();
  await expect(page.getByText(C.BIOMETRIC_UNAVAILABLE, { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Application/ })).toBeFocused();
  await expect(page.getByRole('form', { name: C.TOTP_SETUP, exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: /E-mail/ })).toBeFocused();
  await expect(page.getByRole('form', { name: C.EMAIL_SETUP, exact: true })).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('[data-page-loading]').waitFor({ state: 'hidden' });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`administrator-email-${width}.png`) });
  }
  const audit = await new AxeBuilder({ page }).include('main').analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});
test('activates TOTP without any passkey and requires a new code after signing in again', async ({
  page,
}, info) => {
  const user = await codeAccount(page);
  const secret = await configureTotp(page, user.password);
  await expect(page.locator('.administrator-manual-key')).toHaveCount(0);
  await activateCodes(page);
  await page.context().clearCookies();
  await login(page, user);
  await page.goto('/plateforme');
  await expect(page).toHaveURL(new RegExp(S.PATH));
  expect((await page.request.get('/api/plateforme/export')).status()).toBe(403);
  const code = await totpValue(secret, 1);
  await enterCode(page, C.TOTP_VERIFY, code);
  await expect(page.getByRole('link', { name: S.BACK, exact: true })).toBeVisible();
  expect((await page.request.get('/api/plateforme/export')).status()).toBe(200);
  expect((await securityPost(page, { action: 'totp-verify', code })).status()).toBe(400);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: info.outputPath('administrator-totp-active.png') });
});
test('cannot add a code method from a password alone to a protected account but permits setup after recovery on Mi-like capabilities', async ({
  page,
}) => {
  const { user, codes } = await activateDevice(page);
  await page.context().clearCookies();
  await withoutBiometrics(page);
  await login(page, user);
  await page.goto(S.PATH);
  for (const action of ['totp-prepare', 'email-prepare']) {
    const response = await securityPost(page, { action, password: user.password });
    expect((await response.json()).code).toBe('MFA_REQUIRED');
  }
  await page.locator('summary').filter({ hasText: S.RECOVER }).click();
  const form = page.getByRole('form', { name: S.RECOVER, exact: true });
  await form.getByLabel(S.CODE, { exact: true }).fill(codes[0] ?? '');
  await form.getByRole('button', { name: S.RECOVER, exact: true }).click();
  await expect(page.getByRole('link', { name: S.BACK, exact: true })).toBeVisible();
  const response = await securityPost(page, { action: 'totp-prepare', password: user.password });
  expect(response.ok()).toBe(true);
  expect((await response.json()).data.totpSecret).toMatch(/^[A-Z2-7]{32}$/);
  await expect(page.getByText(S.RECOVERY_COUNT + ' : 9', { exact: true })).toBeVisible();
});
