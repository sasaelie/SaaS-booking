import type { Pool, PoolClient } from 'pg';
import { DatabaseSchema } from '../../config/database';
import { SIMULATION } from '../../config/simulation';
import { guardUseCase } from '../../lib/guard-use-case';
import { ok } from '../../lib/result';
export function syncSimulation(pool: Pool, schema: string, id: string) {
  return guardUseCase('Simulation', 'sync', async () => {
    const source = DatabaseSchema.parse(schema);
    const target = DatabaseSchema.parse(source + SIMULATION.SCHEMA_SUFFIX);
    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      await connection.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [target + id]);
      for (const table of ['time_slots', 'pause_periods'])
        await connection.query(`DELETE FROM "${target}"."${table}" WHERE organization_id=$1`, [id]);
      for (const table of SIMULATION.TABLES) await copyConfiguration(connection, source, target, table, id);
      await connection.query(
        `UPDATE "${target}".organizations SET merchant_account_id=$2,stripe_ready=true,uses_platform_payments=false,bank_iban='TEST — NE PAS EFFECTUER DE VIREMENT',bank_account_name='Simulation sans paiement' WHERE id=$1`,
        [id, SIMULATION.FAKE_ACCOUNT],
      );
      await connection.query(
        `UPDATE "${target}".organization_access SET stripe_customer_id=null,stripe_subscription_id=null WHERE organization_id=$1`,
        [id],
      );
      await connection.query('COMMIT');
      return ok(undefined);
    } catch (error: unknown) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  });
}
async function copyConfiguration(client: PoolClient, source: string, target: string, table: string, id: string) {
  const columns = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position`,
    [source, table],
  );
  const names = columns.rows.map((c) => '"' + c.column_name.replaceAll('"', '""') + '"');
  const key = table === 'organization_access' || table === 'organization_branding' ? 'organization_id' : 'id';
  const tenant = table === 'organizations' ? 'id' : 'organization_id';
  const updates = names
    .filter((n) => n !== '"' + key + '"' && n !== '"id"')
    .map((n) => `${n}=EXCLUDED.${n}`)
    .join(',');
  await client.query(
    `INSERT INTO "${target}"."${table}" (${names.join(',')}) SELECT ${names.join(',')} FROM "${source}"."${table}" WHERE "${tenant}"=$1 ON CONFLICT (${table === 'sessions' ? 'activity_id,starts_at' : '"' + key + '"'}) DO UPDATE SET ${updates}`,
    [id],
  );
}
