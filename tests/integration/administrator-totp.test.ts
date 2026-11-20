import { expect, it } from 'vitest';
import { codeFixture, prepareTotp, totpCode, prepareEmail } from './administrator-code-fixtures';
import { securitySession, prepareSecurity } from './administrator-security-fixtures';
import { pool } from './database';
import { required } from '../../src/adapters/db/transaction';
it('configures a manually entered TOTP secret without a passkey and activates only after backup confirmation', async () => {
  const f = await codeFixture(),
    { secret, recoveryCodes } = await prepareTotp(f, false);
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: false,
    totpEnabled: true,
    emailEnabled: false,
    credentials: [],
    verified: true,
  });
  const stored = (await pool.query('SELECT totp_ciphertext FROM administrator_code_factors'))
    .rows[0].totp_ciphertext;
  expect(stored).not.toContain(secret);
  required(
    await f.repository.mutate(f.actor, {
      action: 'activate',
      code: (recoveryCodes[0] ?? '').replaceAll('-', ''),
    }),
  );
  expect(required(await f.repository.read(f.actor)).enabled).toBe(true);
  expect(JSON.stringify(required(await f.repository.read(f.actor)))).not.toContain(secret);
});
it('accepts the next TOTP in another login session and rejects concurrent reuse atomically', async () => {
  const f = await codeFixture(),
    { secret } = await prepareTotp(f),
    code = await totpCode(secret, 1);
  const actors = await Promise.all([securitySession(f.actor), securitySession(f.actor)]);
  const results = await Promise.all(
    actors.map((actor) => f.repository.mutate(actor, { action: 'totp-verify', code })),
  );
  expect(results.filter((r) => r.ok)).toHaveLength(1);
  expect(
    (await pool.query('SELECT failures FROM administrator_code_factors')).rows[0].failures,
  ).toBe(1);
});
it('commits failed attempt counters, locks after six failures and allows recovery without weakening other methods', async () => {
  const f = await codeFixture(),
    { secret, recoveryCodes, usedCode } = await prepareTotp(f),
    actor = await securitySession(f.actor);
  for (let index = 0; index < 6; index++)
    expect((await f.repository.mutate(actor, { action: 'totp-verify', code: usedCode })).ok).toBe(
      false,
    );
  const stored = (
    await pool.query('SELECT failures,locked_until>now() AS locked FROM administrator_code_factors')
  ).rows[0];
  expect(stored).toMatchObject({ failures: 6, locked: true });
  const locked = await f.repository.mutate(actor, {
    action: 'totp-verify',
    code: await totpCode(secret, 1),
  });
  expect(locked.ok ? null : locked.error.code).toBe('OTP_LOCKED');
  required(
    await f.repository.mutate(actor, {
      action: 'recover',
      code: (recoveryCodes[0] ?? '').replaceAll('-', ''),
    }),
  );
  expect(required(await f.repository.read(actor)).verified).toBe(true);
  await pool.query("UPDATE administrator_code_factors SET locked_until=now()-interval '1 second'");
  required(
    await f.repository.mutate(actor, { action: 'totp-verify', code: await totpCode(secret, 1) }),
  );
  expect(
    (await pool.query('SELECT failures FROM administrator_code_factors')).rows[0].failures,
  ).toBe(0);
});
it('refuses stale, cross-session or expired setup and never silently creates an e-mail bypass for a protected account', async () => {
  const f = await codeFixture();
  const prepared = required(
    await f.repository.mutate(f.actor, { action: 'totp-prepare', password: 'test-only' }),
  );
  const actor = await securitySession(f.actor),
    code = await totpCode(prepared.totpSecret ?? '');
  expect((await f.repository.mutate(actor, { action: 'totp-confirm', code })).ok).toBe(false);
  await pool.query("UPDATE administrator_code_challenges SET expires_at=now()-interval '1 second'");
  expect((await f.repository.mutate(f.actor, { action: 'totp-confirm', code })).ok).toBe(false);
  expect(required(await f.repository.read(f.actor)).totpEnabled).toBe(false);
  await prepareTotp(f);
  for (const command of [
    { action: 'totp-prepare', password: 'test-only' },
    { action: 'email-prepare', password: 'test-only' },
  ] as const) {
    const result = await f.repository.mutate(actor, command);
    expect(result.ok ? null : result.error.code).toBe('MFA_REQUIRED');
  }
  expect((await f.repository.mutate(actor, { action: 'email-send' })).ok).toBe(false);
  expect(f.messages).toHaveLength(0);
});
it('protects the last method, supports combining methods and preserves existing backup codes when adding a passkey or TOTP', async () => {
  const f = await codeFixture();
  const codes = await prepareSecurity({ ...f, repository: f.passkeyRepository });
  const before = await recoveryHashes();
  const added = await prepareTotp(f, false);
  expect(added.recoveryCodes).toEqual([]);
  expect(await recoveryHashes()).toEqual(before);
  required(
    await f.repository.mutate(f.actor, {
      action: 'remove',
      credentialId: f.id,
      password: 'test-only',
    }),
  );
  expect(
    (
      await f.repository.mutate(f.actor, {
        action: 'code-remove',
        method: 'totp',
        password: 'test-only',
      })
    ).ok,
  ).toBe(false);
  await prepareEmail(f, false);
  required(
    await f.repository.mutate(f.actor, {
      action: 'code-remove',
      method: 'totp',
      password: 'test-only',
    }),
  );
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: true,
    totpEnabled: false,
    emailEnabled: true,
    credentials: [],
  });
  expect(codes).toHaveLength(10);
});

async function recoveryHashes() {
  return (await pool.query('SELECT code_hash FROM administrator_recovery_codes ORDER BY code_hash'))
    .rows;
}
