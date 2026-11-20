import { expect, test, type Page } from '@playwright/test';
import { ADMIN_SECURITY as C } from '../../src/config/administrator-security';
import { AdministratorSecurityCommandSchema } from '../../src/core/validation/administrator-security';
import { browserUser, login, closeBrowserDatabase, browserDatabase } from './portal-fixtures';
import { virtualDevice } from './administrator-security-helpers';
test.afterAll(closeBrowserDatabase);
test('rejects a registration whose signed client data reports another origin and leaves the account unenrolled', async ({
  page,
}) => {
  const user = await browserUser(true);
  await virtualDevice(page);
  await login(page, user);
  await page.goto(C.PATH);
  await corruptOrigin(page);
  const form = page.getByRole('form', { name: C.SETUP, exact: true });
  await form.getByLabel(C.PASSWORD, { exact: true }).fill(user.password);
  await form.getByRole('button', { name: C.SETUP, exact: true }).click();
  await page.getByRole('button', { name: C.CONFIRM_DEVICE, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(C.ERROR);
  await expect(page.locator('.administrator-security-panel>.status-badge')).toHaveText(C.INACTIVE);
  expect(
    (
      await browserDatabase().query('SELECT 1 FROM administrator_passkeys WHERE user_id=$1', [
        user.actor.id,
      ])
    ).rowCount,
  ).toBe(0);
  expect(
    (
      await browserDatabase().query(
        'SELECT 1 FROM administrator_security WHERE user_id=$1 AND enabled',
        [user.actor.id],
      )
    ).rowCount,
  ).toBe(0);
});

async function corruptOrigin(page: Page) {
  await page.route('**' + C.API, async (route) => {
    const command = AdministratorSecurityCommandSchema.parse(route.request().postDataJSON());
    if (command.action !== 'register-finish') {
      await route.continue();
      return;
    }
    const clientData: unknown = JSON.parse(
      Buffer.from(command.response.response.clientDataJSON, 'base64url').toString(),
    );
    if (typeof clientData !== 'object' || clientData === null)
      throw Error('WebAuthn client data required');
    command.response.response.clientDataJSON = Buffer.from(
      JSON.stringify({ ...clientData, origin: 'https://attacker.invalid' }),
    ).toString('base64url');
    await route.continue({ postData: JSON.stringify(command) });
  });
}
