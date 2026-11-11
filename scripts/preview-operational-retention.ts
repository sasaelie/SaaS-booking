import { createDatabase } from '../src/adapters/db/client';
import { retainOperational } from '../src/adapters/db/operational-retention';
async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw Error('DATABASE_URL required');
  const { db, pool } = createDatabase(
    url,
    process.env['DATABASE_SCHEMA'],
    process.env['DATABASE_SSL_CA'],
  );
  try {
    const result = await retainOperational(db, new Date(), true);
    if (!result.ok) throw Error(result.error.code);
    process.stdout.write(JSON.stringify(result.value, null, 2) + '\n');
  } finally {
    await pool.end();
  }
}
void main().catch(() => {
  process.stderr.write('Retention preview failed\n');
  process.exitCode = 1;
});
