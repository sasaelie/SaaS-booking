import { createDatabase } from '../src/adapters/db/client';
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const url = process.env['DATABASE_URL'];
  if (!email || !url) throw Error('Provide DATABASE_URL and a verified account email');
  const { pool } = createDatabase(
    url,
    process.env['DATABASE_SCHEMA'],
    process.env['DATABASE_SSL_CA'],
  );
  try {
    const result = await pool.query<{ id: string }>(
      'SELECT id FROM "user" WHERE lower(email)=$1 AND "emailVerified"=true',
      [email],
    );
    const user = result.rows[0];
    if (!user) throw Error('Verified account required');
    await pool.query('INSERT INTO platform_operators(user_id) VALUES($1) ON CONFLICT DO NOTHING', [
      user.id,
    ]);
    console.info('Platform operator access granted.');
  } finally {
    await pool.end();
  }
}
void main().catch(() => {
  console.error('Unable to grant access. Verify configuration and verified account.');
  process.exitCode = 1;
});
