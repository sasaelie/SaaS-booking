import { expect, it } from 'vitest';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
import { recoveryHash } from '../../src/adapters/db/administrator-security/recovery';
import { db, pool } from './database';
import {
  securityFixture,
  securitySession,
  prepareSecurity,
  registrationResponse,
  authenticationResponse,
} from './administrator-security-fixtures';
it('activates only after a verified registration and confirmation of retained recovery codes', async () => {
  const f = await securityFixture();
  expect(required(await f.repository.read(f.actor)).enabled).toBe(false);
  expect(
    (await f.repository.mutate(f.actor, { action: 'activate', code: 'A'.repeat(32) })).ok,
  ).toBe(false);
  const codes = await prepareSecurity(f, false);
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: false,
    verified: true,
    recoveryRemaining: 10,
  });
  expect(
    (await f.repository.mutate(f.actor, { action: 'activate', code: 'A'.repeat(32) })).ok,
  ).toBe(false);
  required(await f.repository.mutate(f.actor, { action: 'activate', code: codes[0] ?? '' }));
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: true,
    recoveryRemaining: 10,
  });
  const stored = await pool.query(
    'SELECT code_hash FROM administrator_recovery_codes WHERE user_id=$1',
    [f.actor.id],
  );
  expect(stored.rows).toHaveLength(10);
  expect(stored.rows[0].code_hash).toHaveLength(64);
  expect(JSON.stringify(stored.rows)).not.toContain(codes[0]);
});
it('enforces MFA in administrator repositories for another session and refuses missing or forged session ownership', async () => {
  const f = await securityFixture();
  await prepareSecurity(f);
  const another = await securitySession(f.actor),
    portal = new DrizzlePortalRepository(db);
  const result = await portal.platform(another, { page: 1, search: '' });
  expect(result.ok ? null : result.error.code).toBe('MFA_REQUIRED');
  expect(
    (await portal.platform({ ...f.actor, sessionId: undefined }, { page: 1, search: '' })).ok,
  ).toBe(false);
  const stranger = await securityFixture();
  expect((await f.repository.read({ ...f.actor, sessionId: stranger.actor.sessionId })).ok).toBe(
    false,
  );
  expect(
    (await f.repository.mutate(another, { action: 'disable', password: 'test-only' })).ok,
  ).toBe(false);
});
it('consumes a recovery code only once even when two sessions race and never stores plain codes', async () => {
  const f = await securityFixture(),
    codes = await prepareSecurity(f);
  const actors = await Promise.all([securitySession(f.actor), securitySession(f.actor)]);
  const results = await Promise.all(
    actors.map((actor) => f.repository.mutate(actor, { action: 'recover', code: codes[0] ?? '' })),
  );
  expect(results.filter((r) => r.ok)).toHaveLength(1);
  expect(required(await f.repository.read(f.actor)).recoveryRemaining).toBe(9);
  const remaining = await pool.query(
    'SELECT 1 FROM administrator_recovery_codes WHERE user_id=$1 AND code_hash=$2',
    [f.actor.id, recoveryHash(f.actor.id, codes[0] ?? '')],
  );
  expect(remaining.rowCount).toBe(0);
});
it('binds challenges to their authenticated session, rejects expiration and refuses replay after verification', async () => {
  const f = await securityFixture();
  await prepareSecurity(f);
  const actor = await securitySession(f.actor);
  required(await f.repository.mutate(actor, { action: 'authenticate-options' }));
  const response = authenticationResponse(f.id);
  expect((await f.repository.mutate(f.actor, { action: 'authenticate-finish', response })).ok).toBe(
    false,
  );
  required(await f.repository.mutate(actor, { action: 'authenticate-finish', response }));
  expect((await f.repository.mutate(actor, { action: 'authenticate-finish', response })).ok).toBe(
    false,
  );
  required(await f.repository.mutate(actor, { action: 'authenticate-options' }));
  await pool.query("UPDATE administrator_challenges SET expires_at=now()-interval '1 second'");
  expect((await f.repository.mutate(actor, { action: 'authenticate-finish', response })).ok).toBe(
    false,
  );
});
it('requires fresh verification for changing credentials and protects the last active device', async () => {
  const f = await securityFixture();
  await prepareSecurity(f);
  expect(
    (
      await f.repository.mutate(f.actor, {
        action: 'remove',
        password: 'test-only',
        credentialId: f.id,
      })
    ).ok,
  ).toBe(false);
  await pool.query(
    "UPDATE administrator_verified_sessions SET verified_at=now()-interval '6 minutes'",
  );
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    verified: true,
    fresh: false,
  });
  for (const action of ['disable', 'rotate-recovery'] as const) {
    const result = await f.repository.mutate(f.actor, { action, password: 'test-only' });
    expect(result.ok ? null : result.error.code).toBe('MFA_REQUIRED');
  }
  expect(
    (
      await f.repository.mutate(f.actor, {
        action: 'register-options',
        password: 'test-only',
        label: 'Other',
      })
    ).ok,
  ).toBe(false);
});
it('keeps private state secret, revokes access immediately and cascades verified state when a login session is removed', async () => {
  const f = await securityFixture();
  await prepareSecurity(f);
  const state = required(await f.repository.read(f.actor));
  expect(JSON.stringify(state)).not.toMatch(/publicKey|code_hash|challenge/);
  await pool.query('DELETE FROM "session" WHERE id=$1', [f.actor.sessionId]);
  expect((await pool.query('SELECT 1 FROM administrator_verified_sessions')).rowCount).toBe(0);
  const actor = await securitySession(f.actor);
  expect(required(await f.repository.read(actor)).verified).toBe(false);
  await pool.query('DELETE FROM platform_operators WHERE user_id=$1', [actor.id]);
  expect((await f.repository.mutate(actor, { action: 'recover', code: 'A'.repeat(32) })).ok).toBe(
    false,
  );
});
it('replaces recovery codes atomically and explicitly disables without leaving credentials or bypass grants', async () => {
  const f = await securityFixture(),
    codes = await prepareSecurity(f);
  const replacement = required(
    await f.repository.mutate(f.actor, { action: 'rotate-recovery', password: 'test-only' }),
  );
  expect(replacement.recoveryCodes).toHaveLength(10);
  expect((await f.repository.mutate(f.actor, { action: 'recover', code: codes[0] ?? '' })).ok).toBe(
    false,
  );
  required(await f.repository.mutate(f.actor, { action: 'disable', password: 'test-only' }));
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: false,
    credentials: [],
    recoveryRemaining: 0,
    verified: false,
  });
  expect(
    (
      await f.repository.mutate(f.actor, {
        action: 'register-finish',
        response: registrationResponse(),
      })
    ).ok,
  ).toBe(false);
});
