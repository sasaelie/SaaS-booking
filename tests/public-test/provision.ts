import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
import { PUBLIC_TEST } from '../../src/config/public-test';
import { PUBLIC_TEST_FORBIDDEN_ENV } from '../../src/config/public-test-env';
const url = new URL(process.env['TEST_DATABASE_URL'] ?? '');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.pathname, '/booking_test');
const pool = new pg.Pool({ connectionString: url.href });
const slug = 'studio-demo';
try {
  const organizationId: unknown = (
    await pool.query('SELECT id FROM public.organizations WHERE slug=$1', [slug])
  ).rows[0]?.id;
  assert.equal(typeof organizationId, 'string', 'Run the isolated demo seed first');
  await pool.query(
    "DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; END $$;",
  );
  for (const name of ['isolation', 'publication']) {
    const sql = (await readFile(`infrastructure/public-test/${name}.sql`, 'utf8')).replaceAll(
      '__SOURCE_SCHEMA__',
      'public',
    );
    await pool.query(sql);
  }
  await pool.query(
    'INSERT INTO booking_public_test.publication(organization_id,slug) VALUES($1,$2)',
    [organizationId, slug],
  );
  await pool.query('SELECT booking_public_test.publish_configuration()');
  const password = randomBytes(32).toString('hex');
  await pool.query(`ALTER ROLE booking_public_test_service PASSWORD '${password}'`);
  url.username = 'booking_public_test_service';
  url.password = password;
  const env = {
    DATABASE_URL: url.href,
    DATABASE_SCHEMA: PUBLIC_TEST.SCHEMA,
    PUBLIC_TEST_MODE: 'true',
    PUBLIC_TEST_ORGANIZATION_ID: organizationId,
    PUBLIC_TEST_ORGANIZATION_SLUG: slug,
    SELF_CANCEL_HMAC_SECRET: randomBytes(32).toString('hex'),
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3008',
    APP_ENVIRONMENT: 'staging',
    PAYMENTS_ENABLED: 'false',
    STORAGE_BACKEND: 'postgres',
  };
  await writeFile(
    '/tmp/booking-public-test-env.sh',
    `unset ${PUBLIC_TEST_FORBIDDEN_ENV.join(' ')}\n` +
      Object.entries(env)
        .map(([key, value]) => `export ${key}='${value}'`)
        .join('\n') +
      '\n',
    { mode: 0o600 },
  );
  console.log('Isolated public TEST schema and scoped login prepared locally.');
} finally {
  await pool.end();
}
