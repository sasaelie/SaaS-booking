import { expect, test } from '@playwright/test';
import { ADMIN_CODES as C } from '../../src/config/administrator-codes';
import { ADMIN_SECURITY as S } from '../../src/config/administrator-security';
import { browserUser, browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import {
  codeAccount,
  activateCodes,
  enterCode,
  receivedCode,
  allowEmailResend,
} from './administrator-code-helpers';
import { securityPost } from './administrator-security-helpers';
test.afterAll(closeBrowserDatabase);
test('confirms the verified email and grants a new session access only after its single-use emailed code', async ({
  page,
}) => {
  const user = await codeAccount(page);
  await page.getByRole('tab', { name: /E-mail/ }).click();
  const form = page.getByRole('form', { name: C.EMAIL_SETUP, exact: true });
  await form.getByLabel(S.PASSWORD, { exact: true }).fill(user.password);
  await form.getByRole('button', { name: C.EMAIL_SETUP, exact: true }).click();
  await expect(page.getByText(C.EMAIL_SENT, { exact: true })).toBeVisible();
  const first = await receivedCode(user.actor.id);
  expect(await page.locator('main').innerText()).not.toContain(first);
  await enterCode(page, C.EMAIL_VERIFY, first);
  await expect(page.locator('.administrator-recovery-codes code')).toHaveCount(10);
  await activateCodes(page);
  await page.context().clearCookies();
  await login(page, user);
  await page.goto(S.PATH);
  await allowEmailResend(user.actor.id);
  await page.reload();
  expect((await page.request.get('/api/plateforme/export')).status()).toBe(403);
  await page.getByRole('button', { name: C.EMAIL_SEND, exact: true }).click();
  await expect(page.getByText(C.EMAIL_SENT, { exact: true })).toBeVisible();
  const next = await receivedCode(user.actor.id);
  await enterCode(page, C.EMAIL_VERIFY, next);
  await expect(page.getByRole('link', { name: S.BACK, exact: true })).toBeVisible();
  expect((await page.request.get('/api/plateforme/export')).status()).toBe(200);
  expect((await securityPost(page, { action: 'email-verify', code: next })).status()).toBe(400);
});
test('enforces resend cooldown, email expiry and the hourly send limit at the HTTP boundary', async ({
  page,
}) => {
  const user = await codeAccount(page);
  const send = () => securityPost(page, { action: 'email-prepare', password: user.password });
  expect((await send()).ok()).toBe(true);
  const first = await receivedCode(user.actor.id);
  expect((await send()).status()).toBe(429);
  await browserDatabase().query(
    "UPDATE administrator_code_challenges SET expires_at=now()-interval '1 second' WHERE user_id=$1",
    [user.actor.id],
  );
  expect((await securityPost(page, { action: 'email-confirm', code: first })).status()).toBe(400);
  await allowEmailResend(user.actor.id);
  expect((await send()).ok()).toBe(true);
  await allowEmailResend(user.actor.id);
  expect((await send()).status()).toBe(429);
  const result = await browserDatabase().query(
    'SELECT count(*)::int AS count FROM verification WHERE identifier=$1',
    ['local-administrator-mail:' + user.actor.id],
  );
  expect(result.rows[0].count).toBe(2);
});
test('refuses hostile origins, a forged recipient and ordinary organizer accounts for code enrollment', async ({
  page,
}) => {
  const user = await codeAccount(page);
  const command = { action: 'email-prepare', password: user.password };
  expect((await securityPost(page, command, 'https://attacker.invalid')).status()).toBe(403);
  expect((await securityPost(page, { ...command, email: 'attacker@example.com' })).status()).toBe(
    400,
  );
  const response = await securityPost(page, {
    action: 'email-prepare',
    password: 'wrong-password',
  });
  expect(response.ok()).toBe(false);
  await page.context().clearCookies();
  const ordinary = await browserUser(false);
  await login(page, ordinary);
  expect(
    (await securityPost(page, { action: 'totp-prepare', password: ordinary.password })).status(),
  ).toBe(400);
  expect(
    (await securityPost(page, { action: 'email-prepare', password: ordinary.password })).status(),
  ).toBe(400);
  const records = await browserDatabase().query(
    'SELECT 1 FROM administrator_code_factors WHERE user_id=$1',
    [ordinary.actor.id],
  );
  expect(records.rowCount).toBe(0);
});
