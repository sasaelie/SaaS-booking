import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { browserSpace, closeBrowserDatabase } from '../e2e/portal-fixtures';
import { DrizzleBookingPublicationRepository } from '../../src/adapters/db/drizzle-booking-publication.repository';
import { BookingPublicationUseCase } from '../../src/core/use-cases/portal/booking-publication.use-case';
import { EnvironmentSchema } from '../../src/config/env';
import { ok } from '../../src/lib/result';
const url = new URL(process.env['TEST_DATABASE_URL'] ?? '');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.pathname, '/booking_test');
const admin = new pg.Pool({ connectionString: url.href });
const restricted = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
const ids: string[] = [];
try {
  await verify();
  console.log(
    'Two independent self-service publications, explicit consent, ownership, exact tariffs, live synchronization and restricted-role visibility verified.',
  );
} finally {
  await admin.query(
    'DELETE FROM booking_public_test.publication WHERE organization_id=ANY($1::uuid[])',
    [ids],
  );
  for (const table of [
    'sessions',
    'time_slots',
    'organization_access',
    'organization_branding',
    'private_files',
    'activities',
  ]) {
    await admin.query(
      `DELETE FROM booking_public_test.${table} WHERE organization_id=ANY($1::uuid[])`,
      [ids],
    );
  }
  await admin.query('DELETE FROM booking_public_test.organizations WHERE id=ANY($1::uuid[])', [
    ids,
  ]);
  await closeBrowserDatabase();
  await restricted.end();
  await admin.end();
}
async function verify() {
  const first = await browserSpace(),
    second = await browserSpace();
  ids.push(first.organizationId, second.organizationId);
  const env = publicationEnvironment(first.organizationId);
  const repository = new DrizzleBookingPublicationRepository(drizzle(admin), env);
  const one = new BookingPublicationUseCase({ current: async () => ok(first.actor) }, repository);
  const two = new BookingPublicationUseCase({ current: async () => ok(second.actor) }, repository);
  const state = await one.read({ organizationId: first.organizationId });
  assert.ok(state.ok && state.value.activationRequired && !state.value.published);
  assert.equal((await one.publish({ organizationId: first.organizationId })).ok, false);
  assert.equal(
    (await one.publish({ organizationId: second.organizationId, acknowledged: true })).ok,
    false,
  );
  assert.equal(
    (await one.publish({ organizationId: first.organizationId, acknowledged: true })).ok,
    true,
  );
  assert.equal(
    (await two.publish({ organizationId: second.organizationId, acknowledged: true })).ok,
    true,
  );
  assert.deepEqual(
    await two.read({ organizationId: second.organizationId }),
    ok({ appUrl: env.PUBLIC_BOOKING_URL, published: true, activationRequired: false }),
  );
  await verifyPublishedCopies(first, second);
  await admin.query("UPDATE public.activities SET payment_mode='STRIPE' WHERE id=$1", [
    second.activityId,
  ]);
  await appendFile(
    '/tmp/booking-public-test-env.sh',
    `export TEST_SECONDARY_ORGANIZATION_SLUG='${second.slug}'\n`,
  );
  ids.splice(ids.indexOf(second.organizationId), 1); // Keep this synthetic fixture for the public browser test.
}

function publicationEnvironment(organizationId: string) {
  return EnvironmentSchema.parse({
    DATABASE_URL: url.href,
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3012',
    APP_ENVIRONMENT: 'staging',
    PAYMENTS_ENABLED: 'false',
    SELF_CANCEL_HMAC_SECRET: 'a'.repeat(32),
    PUBLIC_BOOKING_URL: 'https://test.example.com',
    PUBLIC_BOOKING_ORGANIZATION_ID: organizationId,
  });
}

async function verifyPublishedCopies(
  first: Awaited<ReturnType<typeof browserSpace>>,
  second: Awaited<ReturnType<typeof browserSpace>>,
) {
  const rows = await restricted.query(
    'SELECT organization_id,price_cents FROM booking_public_test.activities WHERE organization_id=ANY($1::uuid[]) ORDER BY organization_id',
    [ids],
  );
  assert.equal(rows.rowCount, 2);
  assert.ok(rows.rows.every((row) => row.price_cents === 2500));
  await admin.query('UPDATE public.activities SET price_cents=3175 WHERE id=$1', [
    first.activityId,
  ]);
  const prices = await restricted.query(
    'SELECT organization_id,price_cents FROM booking_public_test.activities WHERE organization_id=ANY($1::uuid[])',
    [ids],
  );
  assert.equal(
    prices.rows.find((row) => row.organization_id === first.organizationId)?.price_cents,
    3175,
  );
  assert.equal(
    prices.rows.find((row) => row.organization_id === second.organizationId)?.price_cents,
    2500,
  );
  await assert.rejects(
    restricted.query('SELECT booking_public_test.publish_organization($1)', [
      second.organizationId,
    ]),
    /permission denied/,
  );
  await assert.rejects(
    restricted.query('UPDATE booking_public_test.publication SET enabled=true'),
    /permission denied/,
  );
}
