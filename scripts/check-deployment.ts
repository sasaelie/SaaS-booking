import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EnvironmentSchema } from '../src/config/env';
import { createDatabase } from '../src/adapters/db/client';

const groups = {
  database: ['DATABASE_URL'],
  application: ['NEXT_PUBLIC_APP_URL', 'SELF_CANCEL_HMAC_SECRET', 'BETTER_AUTH_SECRET'],
  email: ['RESEND_API_KEY', 'MAIL_FROM'],
  privateStorage: [
    'STORAGE_REGION',
    'STORAGE_BUCKET',
    'STORAGE_ACCESS_KEY_ID',
    'STORAGE_SECRET_ACCESS_KEY',
  ],
  jobs: ['CRON_SECRET'],
} as const;

function configuration(): boolean {
  let complete = true;
  for (const [group, keys] of Object.entries(groups)) {
    if (group === 'privateStorage' && process.env['STORAGE_BACKEND'] === 'postgres') {
      console.info('privateStorage: DATABASE STAGING (quota 50 MiB)');
      continue;
    }
    const missing = keys.filter((key) => !process.env[key]?.trim());
    if (missing.length) complete = false;
    console.info(`${group}: ${missing.length ? `MISSING (${missing.join(', ')})` : 'CONFIGURED'}`);
  }
  console.info('payments: DEFERRED (Stripe / Mollie exclus de ce contrôle)');
  return complete;
}

async function database(): Promise<boolean> {
  const parsed = EnvironmentSchema.safeParse(process.env);
  if (!parsed.success) {
    console.info('databaseProbe: BLOCKED (configuration invalide ou incomplète)');
    return false;
  }
  const { pool } = createDatabase(
    parsed.data.DATABASE_URL,
    parsed.data.DATABASE_SCHEMA,
    parsed.data.DATABASE_SSL_CA,
  );
  try {
    const result = await pool.query<{ name: string; hash: string }>(
      'SELECT name, hash FROM schema_migrations',
    );
    const files = (await readdir('migrations')).filter((name) => name.endsWith('.sql')).sort();
    for (const name of files) {
      const hash = createHash('sha256')
        .update(await readFile(`migrations/${name}`))
        .digest('hex');
      if (!result.rows.some((row) => row.name === name && row.hash === hash)) {
        console.info('databaseProbe: FAILED (migration absente ou empreinte différente)');
        return false;
      }
    }
    console.info(`databaseProbe: OK (${files.length} migrations vérifiées, lecture seule)`);
    return true;
  } catch {
    console.info('databaseProbe: FAILED (connexion ou lecture du registre impossible)');
    return false;
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const configured = configuration();
  const connected = await database();
  console.info(
    'Ce diagnostic ne vérifie pas la livraison des e-mails, le stockage, les sauvegardes ou les tâches planifiées.',
  );
  console.info('Une configuration présente ne constitue pas une validation de mise en production.');
  if (!configured || !connected) process.exitCode = 1;
}

void main().catch(() => {
  console.error('Diagnostic interrompu. Aucun secret affiché.');
  process.exitCode = 1;
});
