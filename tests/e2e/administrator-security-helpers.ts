import { expect, type Page } from '@playwright/test';
import { ADMIN_SECURITY as C } from '../../src/config/administrator-security';
import { browserUser, login, browserDatabase } from './portal-fixtures';
export async function virtualDevice(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable');
  const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return { client, authenticatorId };
}
export async function prepareDevice(page: Page) {
  const user = await browserUser(true),
    device = await virtualDevice(page);
  await login(page, user);
  await page.goto(C.PATH);
  const form = page.getByRole('form', { name: C.SETUP, exact: true });
  await form.getByLabel(C.PASSWORD, { exact: true }).fill(user.password);
  await form.getByRole('button', { name: C.SETUP, exact: true }).click();
  await page.getByRole('button', { name: C.CONFIRM_DEVICE, exact: true }).click();
  const codesSection = page.getByRole('region', { name: C.CODES_TITLE, exact: true });
  await expect(codesSection.locator('code')).toHaveCount(10);
  const codes = await codesSection.locator('code').allTextContents();
  return { user, device, codes };
}
export async function activateDevice(page: Page) {
  const prepared = await prepareDevice(page);
  const form = page.getByRole('form', { name: C.ACTIVATE, exact: true });
  await form.getByLabel(C.CODE_CONFIRM, { exact: true }).fill(prepared.codes[0] ?? '');
  await form.getByRole('button', { name: C.ACTIVATE, exact: true }).click();
  await expect(page.locator('.administrator-security-panel>.status-badge')).toHaveText(C.ACTIVE);
  return prepared;
}
export async function verifyDevice(page: Page) {
  await page.getByRole('button', { name: C.VERIFY, exact: true }).click();
  await page.getByRole('button', { name: C.CONFIRM_DEVICE, exact: true }).click();
  await expect(page.getByRole('link', { name: C.BACK, exact: true })).toBeVisible();
}
export async function securityPost(page: Page, data: unknown, origin = new URL(page.url()).origin) {
  return page.request.post(C.API, { data, headers: { Origin: origin } });
}
export async function setVerificationAge(userId: string, minutes: number) {
  await browserDatabase().query(
    "UPDATE administrator_verified_sessions SET verified_at=now()-$2*interval '1 minute' WHERE user_id=$1",
    [userId, minutes],
  );
}
export function watchAssertion(page: Page) {
  let assertion: unknown;
  page.on('request', (r) => {
    if (!r.url().endsWith(C.API) || r.method() !== 'POST') return;
    const data: unknown = r.postDataJSON();
    if (
      typeof data === 'object' &&
      data !== null &&
      'action' in data &&
      data.action === 'authenticate-finish'
    )
      assertion = data;
  });
  return () => assertion;
}
