import { expect, test } from '@playwright/test';
import { browserSpace, login, closeBrowserDatabase } from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('returns from the appearance catalogue and activity to the organizer without exposing private navigation to visitors', async ({
  page,
  browser,
}) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/${space.slug}?from=appearance`);
  await expect(page.getByRole('link', { name: 'Retour aux réglages d’apparence' })).toHaveAttribute(
    'href',
    `/app/${space.organizationId}/parametres`,
  );
  await page.getByRole('link', { name: 'Choisir une séance' }).click();
  await expect(page).toHaveURL(/from=appearance/);
  await page.getByRole('link', { name: 'Retour aux réglages d’apparence' }).click();
  await expect(page).toHaveURL(`/app/${space.organizationId}/parametres`);
  const visitor = await browser.newContext();
  const other = await visitor.newPage();
  await other.goto(`/${space.slug}/${space.activityId}?from=appearance`);
  await expect(other.getByRole('link', { name: 'Retour aux activités' })).toHaveAttribute(
    'href',
    `/${space.slug}`,
  );
  await expect(
    other.getByRole('link', { name: /Retour.*organisateur|Retour aux réglages/ }),
  ).toHaveCount(0);
  await visitor.close();
});
