import assert from 'node:assert/strict';
import pg from 'pg';
const privateUrl = new URL(process.env['TEST_DATABASE_URL'] ?? '');
assert.equal(privateUrl.hostname, '127.0.0.1');
assert.equal(privateUrl.pathname, '/booking_test');
const admin = new pg.Client({ connectionString: privateUrl.href });
const service = new pg.Client({ connectionString: process.env['DATABASE_URL'] });
await admin.connect();
await service.connect();
try {
  await privileges();
  await publication();
  const personal = await admin.query(
    "SELECT count(*)::int AS count FROM booking_public_test.bookings WHERE email<>'participant@example.invalid' OR first_name<>'Participant' OR last_name<>'TEST' OR marketing_opt_in",
  );
  assert.equal(personal.rows[0].count, 0);
  assert.equal(
    (await admin.query('SELECT count(*)::int AS count FROM booking_public_test.outbox_jobs'))
      .rows[0].count,
    0,
  );
  console.log(
    'Restricted role, private data isolation, invoker triggers, publication rollback and synthetic bookings verified.',
  );
} finally {
  await service.end();
  await admin.end();
}
async function privileges() {
  for (const table of [
    'user',
    'account',
    'session',
    'bookings',
    'private_files',
    'organization_members',
  ]) {
    const result = await admin.query("SELECT has_table_privilege($1,$2,'SELECT') allowed", [
      'booking_public_test_service',
      `public.${table}`,
    ]);
    assert.equal(result.rows[0].allowed, false);
    await assert.rejects(
      service.query(`SELECT * FROM public."${table}" LIMIT 1`),
      /permission denied/,
    );
  }
  const fk = await admin.query(
    "SELECT count(*)::int AS count FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace JOIN pg_class ref ON ref.oid=c.confrelid JOIN pg_namespace rn ON rn.oid=ref.relnamespace WHERE n.nspname='booking_public_test' AND c.contype='f' AND rn.nspname<>'booking_public_test'",
  );
  assert.equal(fk.rows[0].count, 0);
  const unsafe = await admin.query(
    "SELECT count(*)::int AS count FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='booking_public_test' AND p.prosecdef",
  );
  assert.equal(unsafe.rows[0].count, 0);
  await assert.rejects(
    service.query('SELECT booking_public_test.publish_configuration()'),
    /permission denied/,
  );
  await assert.rejects(
    service.query("UPDATE booking_public_test.activities SET name='forged'"),
    /permission denied/,
  );
}
async function publication() {
  await admin.query('BEGIN');
  try {
    const before = await admin.query('SELECT count(*)::int AS count FROM public.bookings');
    const row = (
      await admin.query(
        'SELECT id,organization_id FROM booking_public_test.activities WHERE is_active LIMIT 1',
      )
    ).rows[0];
    assert.ok(row);
    await admin.query(
      "UPDATE public.activities SET name='Publication de test',price_cents=9999 WHERE id=$1",
      [row.id],
    );
    const copy = (
      await admin.query(
        'SELECT name,price_cents,payment_mode FROM booking_public_test.activities WHERE id=$1',
        [row.id],
      )
    ).rows[0];
    assert.deepEqual(copy, { name: 'Publication de test', price_cents: 0, payment_mode: 'NONE' });
    await admin.query('UPDATE public.activities SET is_active=false WHERE id=$1', [row.id]);
    assert.equal(
      (
        await admin.query('SELECT is_active FROM booking_public_test.activities WHERE id=$1', [
          row.id,
        ])
      ).rows[0].is_active,
      false,
    );
    assert.equal(
      (await admin.query('SELECT count(*)::int AS count FROM public.bookings')).rows[0].count,
      before.rows[0].count,
    );
  } finally {
    await admin.query('ROLLBACK');
  }
}
