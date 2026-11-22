import assert from 'node:assert/strict';
import pg from 'pg';
const url = new URL(process.env['TEST_DATABASE_URL'] ?? '');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.pathname, '/booking_test');
const db = new pg.Client({ connectionString: url.href });
await db.connect();
await db.query('BEGIN');
try {
  const activity = (
    await db.query(
      'SELECT id,organization_id FROM booking_public_test.activities WHERE is_active AND organization_id=$1 LIMIT 1',
      [process.env['PUBLIC_TEST_ORGANIZATION_ID']],
    )
  ).rows[0];
  assert.ok(activity);
  const start = new Date(Date.now() + 30 * 86400000).toISOString();
  const end = new Date(Date.now() + 30 * 86400000 + 7200000).toISOString();
  const source = await db.query(
    'INSERT INTO public.sessions(organization_id,activity_id,starts_at,ends_at,capacity,is_manual) VALUES($1,$2,$3,$4,8,true) RETURNING id',
    [activity.organization_id, activity.id, start, end],
  );
  const copy = (
    await db.query(
      'SELECT id FROM booking_public_test.sessions WHERE activity_id=$1 AND starts_at=$2',
      [activity.id, start],
    )
  ).rows[0];
  assert.ok(copy);
  assert.notEqual(copy.id, source.rows[0].id);
  await db.query(
    "UPDATE public.sessions SET starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day' WHERE id=$1",
    [source.rows[0].id],
  );
  assert.equal(
    (await db.query('SELECT is_cancelled FROM booking_public_test.sessions WHERE id=$1', [copy.id]))
      .rows[0].is_cancelled,
    true,
  );
  assert.equal(
    (
      await db.query(
        'SELECT count(*)::int AS count FROM booking_public_test.sessions WHERE activity_id=$1 AND is_manual AND NOT is_cancelled AND starts_at>$2',
        [activity.id, start],
      )
    ).rows[0].count,
    1,
  );
  console.log('Manual creation and date changes publish safely with independent TEST session IDs.');
} finally {
  await db.query('ROLLBACK');
  await db.end();
}
