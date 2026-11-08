import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../src/adapters/db/client';
async function migrateFile(
  client: ReturnType<typeof createDatabase>['pool'],
  name: string,
): Promise<void> {
  const content = await readFile(`migrations/${name}`, 'utf8');
  const hash = createHash('sha256').update(content).digest('hex');
  const connection = await client.connect();
  try {
    await connection.query('BEGIN');
    await connection.query('SELECT pg_advisory_xact_lock(973601)');
    const existing = await connection.query<{ hash: string }>(
      'SELECT hash FROM schema_migrations WHERE name=$1',
      [name],
    );
    if (existing.rows[0] && existing.rows[0].hash !== hash)
      throw Error('Migration checksum mismatch');
    if (!existing.rowCount) {
      await connection.query(content);
      await connection.query('INSERT INTO schema_migrations(name,hash) VALUES($1,$2)', [
        name,
        hash,
      ]);
    }
    await connection.query('COMMIT');
  } catch (error: unknown) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw Error('DATABASE_URL required');
  const { db, pool } = createDatabase(url, process.env['DATABASE_SCHEMA']);
  try {
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, hash text NOT NULL)`,
    );
    for (const name of (await readdir('migrations')).filter((file) => file.endsWith('.sql')).sort())
      await migrateFile(pool, name);
  } finally {
    await pool.end();
  }
}
void main().catch(() => {
  console.error('Database migration failed');
  process.exitCode = 1;
});
