import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { expect, type Page } from '@playwright/test';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
const url = process.env['TEST_DATABASE_URL'];
if (!url || !/^postgresql:\/\/[^@]+@127\.0\.0\.1:[0-9]+\/booking_test$/.test(url))
  throw Error('Local booking_test required');
let instance: Pool | undefined;
export function browserDatabase() {
  instance ??= new Pool({ connectionString: url });
  return instance;
}
export async function closeBrowserDatabase() {
  const pool = instance;
  instance = undefined;
  await pool?.end();
}
export async function browserUser(operator = false) {
  await browserDatabase().query('TRUNCATE "rateLimit"');
  const actor = {
    id: crypto.randomUUID(),
    email: `organizer-${crypto.randomUUID()}@example.com`,
    name: 'Camille Martin',
  };
  const password = 'Browser-test-only-password-12345!';
  await browserDatabase().query(
    'INSERT INTO "user"(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',
    [actor.id, actor.name, actor.email],
  );
  await browserDatabase().query(
    'INSERT INTO account(id,"accountId","providerId","userId",password) VALUES($1,$2,$3,$2,$4)',
    [crypto.randomUUID(), actor.id, 'credential', await hashPassword(password)],
  );
  if (operator)
    await browserDatabase().query('INSERT INTO platform_operators(user_id) VALUES($1)', [actor.id]);
  return { actor, password };
}
export async function browserSpace() {
  const user = await browserUser(true);
  const repo = new DrizzlePortalRepository(drizzle(browserDatabase()));
  const slug = `atelier-${crypto.randomUUID()}`;
  const { organizationId } = required(
    await repo.createOrganization(user.actor, {
      name: 'Ateliers du quartier',
      slug,
      kind: 'NONPROFIT',
      timezone: 'Europe/Brussels',
    }),
  );
  required(await repo.grantAccess(user.actor, organizationId, true));
  const date = new Date(Date.now() + 7 * 86400000);
  date.setUTCHours(13, 0, 0, 0);
  const { activityId } = required(
    await repo.createActivity(user.actor, {
      organizationId,
      name: 'Initiation à la céramique',
      description: 'Une parenthèse créative pour découvrir la terre, à votre rythme.',
      priceCents: 2500,
      audiencePolicy: 'ALL_PUBLIC',
      paymentMode: 'NONE',
      requirePhone: false,
      bookingWindowWeeks: 4,
      noticeHoursForVoucher: 72,
      voucherValidityMonths: 3,
      schedule: {
        kind: 'MANUAL',
        startsAt: date,
        endsAt: new Date(date.getTime() + 7200000),
        capacity: 8,
      },
    }),
  );
  return { ...user, organizationId, activityId, slug, date };
}
export async function login(page: Page, user: Awaited<ReturnType<typeof browserUser>>) {
  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(user.actor.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
}
export async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
}
