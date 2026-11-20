import { expect, type Page } from '@playwright/test';
import { createOTP } from '@better-auth/utils/otp';
import { base32 } from '@better-auth/utils/base32';
import { ADMIN_CODES as C } from '../../src/config/administrator-codes';
import { ADMIN_SECURITY as S } from '../../src/config/administrator-security';
import { browserDatabase, browserUser, login } from './portal-fixtures';
export async function withoutBiometrics(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'PublicKeyCredential', { configurable: true, value: undefined }),
  );
}
export async function codeAccount(page: Page) {
  await withoutBiometrics(page);
  const user = await browserUser(true);
  await login(page, user);
  await page.goto(S.PATH);
  await expect(page.getByRole('tab', { name: /Application/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  return user;
}
export async function configureTotp(page: Page, password: string) {
  await page.getByRole('tab', { name: /Application/ }).click();
  const form = page.getByRole('form', { name: C.TOTP_SETUP, exact: true });
  await form.getByLabel(S.PASSWORD, { exact: true }).fill(password);
  await form.getByRole('button', { name: C.TOTP_SETUP, exact: true }).click();
  const key = page.locator('.administrator-manual-key code');
  await expect(key).toHaveText(/^[A-Z2-7]{32}$/);
  const secret = (await key.textContent()) ?? '';
  await enterCode(page, C.TOTP_CONFIRM, await totpValue(secret));
  await expect(page.locator('.administrator-recovery-codes code')).toHaveCount(10);
  return secret;
}
export async function totpValue(secret: string, offset = 0) {
  return createOTP(base32.decode(secret), { digits: C.DIGITS, period: C.PERIOD_SECONDS }).hotp(
    Math.floor(Date.now() / (C.PERIOD_SECONDS * 1000)) + offset,
  );
}
export async function enterCode(page: Page, label: string, code: string) {
  const form = page.getByRole('form', { name: label, exact: true });
  await form.getByLabel(C.CODE, { exact: true }).fill(code);
  await form.getByRole('button', { name: label, exact: true }).click();
}
export async function activateCodes(page: Page) {
  const codes = await page.locator('.administrator-recovery-codes code').allTextContents();
  const form = page.getByRole('form', { name: S.ACTIVATE, exact: true });
  await form.getByLabel(S.CODE_CONFIRM, { exact: true }).fill(codes[0] ?? '');
  await form.getByRole('button', { name: S.ACTIVATE, exact: true }).click();
  await expect(page.locator('.administrator-security-panel>.status-badge')).toHaveText(S.ACTIVE);
  return codes;
}
export async function receivedCode(userId: string) {
  const result = await browserDatabase().query<{ value: string }>(
    'SELECT value FROM verification WHERE identifier=$1 ORDER BY "createdAt" DESC LIMIT 1',
    ['local-administrator-mail:' + userId],
  );
  const value = result.rows[0]?.value;
  expect(value).toMatch(/^[0-9]{6}$/);
  return value ?? '';
}
export async function allowEmailResend(userId: string) {
  await browserDatabase().query(
    "UPDATE administrator_code_factors SET email_sent_at=now()-interval '61 seconds' WHERE user_id=$1",
    [userId],
  );
}
