import { expect, it } from 'vitest';
import { pool } from './database';
import { confirmed } from './participant-fixtures';
import { portalFixture } from './portal-fixtures';
import { DrizzlePlatformSettingsRepository } from '../../src/adapters/db/drizzle-platform-settings.repository';
import { db } from './database';
import { PlatformPublicProfileSchema } from '../../src/core/validation/platform-settings';
import { required } from '../../src/adapters/db/transaction';
it('denies a nonprivileged database role access and RLS still hides published rows after an accidental table grant', async () => {
  await confirmed();
  const { actor } = await portalFixture(true);
  const repository = new DrizzlePlatformSettingsRepository(db);
  required(
    await repository.mutate(actor, {
      action: 'save',
      revision: 0,
      profile: PlatformPublicProfileSchema.parse({ email: 'private@example.invalid' }),
    }),
  );
  required(await repository.mutate(actor, { action: 'publish', revision: 1 }));
  const connection = await pool.connect(),
    role = `security_probe_${crypto.randomUUID().replaceAll('-', '')}`;
  try {
    await connection.query('BEGIN');
    await connection.query(`CREATE ROLE "${role}" NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await connection.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);
    await connection.query(`SET LOCAL ROLE "${role}"`);
    await connection.query('SAVEPOINT denied');
    await expect(connection.query('SELECT * FROM public.platform_settings')).rejects.toMatchObject({
      code: '42501',
    });
    await connection.query('ROLLBACK TO SAVEPOINT denied');
    await connection.query('RESET ROLE');
    await connection.query(
      `GRANT SELECT ON public.platform_settings,public.bookings,public.booking_access_credentials TO "${role}"`,
    );
    await connection.query(`SET LOCAL ROLE "${role}"`);
    for (const table of ['platform_settings', 'bookings', 'booking_access_credentials']) {
      const result = await connection.query(`SELECT count(*)::int AS count FROM public.${table}`);
      expect(result.rows[0].count).toBe(0);
    }
  } finally {
    await connection.query('ROLLBACK');
    connection.release();
  }
});
it('reproduces the RLS and PUBLIC privilege baseline for all primary and simulation application tables', async () => {
  const result = await pool.query(
    "SELECT n.nspname,c.relname,c.relrowsecurity AS rls,EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee=0 AND a.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) AS public_access FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN ('public','public_simulation')",
  );
  expect(result.rows.length).toBeGreaterThanOrEqual(53);
  expect(result.rows.filter((row) => !row.rls || row.public_access)).toEqual([]);
});
