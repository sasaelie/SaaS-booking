import { expect, test, type Page } from '@playwright/test';
import { browserSpace, login, browserDatabase, closeBrowserDatabase } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
async function createTest(page: Page, space: Awaited<ReturnType<typeof browserSpace>>) {
  await login(page, space);
  await page.goto(`/simulation/${space.organizationId}/activite/${space.activityId}`);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Alex');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Test');
  await page
    .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
    .fill('simulation-login@example.invalid');
  await page.getByRole('checkbox', { name: /Je certifie/ }).check();
  await page.getByRole('checkbox', { name: /J’ai lu et j’accepte/ }).check();
  await page.getByRole('button', { name: 'Confirmer ma place', exact: true }).click();
  const code = page.locator('.inline-booking-proof textarea');
  await expect(code).toHaveValue(/^TEST-/);
  return code.inputValue();
}
async function submitCode(page: Page, code: string, origin = '') {
  await page.goto(`${origin}/connexion?acces=participant`);
  await page.getByLabel('Votre code de réservation').fill(code);
  await page.getByRole('button', { name: 'Retrouver ma réservation', exact: true }).click();
}
test('opens a TEST code through participant login for its organizer and keeps it usable after refresh', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await createTest(page, space);
  await submitCode(page, code);
  await expect(page).toHaveURL(new RegExp(`/simulation/${space.organizationId}/gestion#token=`));
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  await expect(page.locator('.ticket-test')).toContainText('TEST');
  await page.reload();
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  expect((await page.context().cookies()).some((c) => c.name.includes('participant_booking'))).toBe(
    false,
  );
  const rows = await browserDatabase().query(
    'SELECT count(*) FROM bookings WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(rows.rows[0]?.count).toBe('0');
  await page.goto('/app');
  await expect(page).toHaveURL('/app');
});
test('requires the correct organizer account and refuses anonymous TEST login', async ({
  page,
  browser,
}) => {
  const space = await browserSpace();
  const code = await createTest(page, space);
  const origin = new URL(page.url()).origin;
  const visitor = await browser.newContext();
  const anonymous = await visitor.newPage();
  await submitCode(anonymous, code, origin);
  await expect(anonymous.getByText('Code TEST inaccessible.', { exact: false })).toBeVisible();
  await visitor.close();
  const other = await browserSpace();
  const otherContext = await browser.newContext({ baseURL: origin });
  const foreign = await otherContext.newPage();
  await login(foreign, other);
  await submitCode(foreign, code, origin);
  await expect(foreign.getByText('Code TEST inaccessible.', { exact: false })).toBeVisible();
  expect((await otherContext.cookies()).some((c) => c.name.includes('participant_booking'))).toBe(
    false,
  );
  await otherContext.close();
});
test('redirects a TEST code entered through the generic management link to the isolated simulation', async ({
  page,
}) => {
  const space = await browserSpace();
  const code = await createTest(page, space);
  await page.goto(`/manage#code=${encodeURIComponent(code)}`);
  await expect(page).toHaveURL(new RegExp(`/simulation/${space.organizationId}/gestion#token=`));
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
  await page.goto(`/simulation/${space.organizationId}/gestion#code=${encodeURIComponent(code)}`);
  await expect(page).toHaveURL(new RegExp(`/simulation/${space.organizationId}/gestion#token=`));
  await page.reload();
  await expect(page.getByLabel('Votre code de réservation')).toHaveValue(code);
});
