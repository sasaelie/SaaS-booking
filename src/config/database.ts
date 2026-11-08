import { z } from 'zod';

export const DATABASE = {
  DEFAULT_SCHEMA: 'public',
  POOL_MAX: 3,
  CONNECTION_TIMEOUT_MS: 10_000,
  IDLE_TIMEOUT_MS: 20_000,
  TRANSACTION_POOLER_PORT: '6543',
} as const;

export const DatabaseSchema = z.string().regex(/^[a-z_][a-z0-9_]{0,62}$/);

export function supportsSessionLocks(value: string): boolean {
  try {
    const url = new URL(value);
    return !(
      url.hostname.endsWith('.pooler.supabase.com') && url.port === DATABASE.TRANSACTION_POOLER_PORT
    );
  } catch {
    return false;
  }
}
