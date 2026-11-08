import { describe, expect, it } from 'vitest';
import { databasePoolOptions } from '../../src/adapters/db/pool-options';
import { EnvironmentSchema } from '../../src/config/env';

describe('Hosted database connection safety', () => {
  it('enforces certificate verification for Supabase even if the URL disables TLS', () => {
    const options = databasePoolOptions(
      'postgresql://app:test@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=disable',
      'booking',
      'public-ca',
    );
    expect(options.ssl).toEqual({ rejectUnauthorized: true, ca: 'public-ca' });
    expect(options.connectionString).not.toContain('sslmode=disable');
  });
  it('preserves session locks and bounds connection usage', () => {
    const options = databasePoolOptions('postgresql://app:test@localhost/booking', 'booking');
    expect(options.options).toBe('-c search_path=booking,public');
    expect(options.max).toBe(3);
    expect(options.connectionTimeoutMillis).toBeGreaterThan(0);
    expect(options.ssl).toBeUndefined();
  });

  it('rejects a transaction pooler incompatible with billing locks', () => {
    const url = 'postgresql://app:test@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';
    expect(() => databasePoolOptions(url)).toThrow('Session connection required');
    expect(
      EnvironmentSchema.safeParse({
        DATABASE_URL: url,
        NEXT_PUBLIC_APP_URL: 'https://example.com',
        SELF_CANCEL_HMAC_SECRET: 'a'.repeat(32),
      }).success,
    ).toBe(false);
  });

  it('rejects injected schema names and accepts the session pooler', () => {
    const url = 'postgresql://app:test@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
    expect(databasePoolOptions(url, 'booking').connectionString).toBe(url);
    expect(() => databasePoolOptions(url, 'booking; DROP SCHEMA public')).toThrow();
  });
});
