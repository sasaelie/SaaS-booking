import { expect, it } from 'vitest';
import { codeFixture, prepareEmail, prepareTotp } from './administrator-code-fixtures';
import { securitySession } from './administrator-security-fixtures';
import { pool } from './database';
import { required } from '../../src/adapters/db/transaction';
it('sends only to the verified account address, stores only a proof hash and enables the factor after confirmation', async () => {
  const f = await codeFixture();
  const sent = required(
    await f.repository.mutate(f.actor, { action: 'email-prepare', password: 'test-only' }),
  );
  expect(sent.emailNextSendAt).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z$/);
  expect(f.messages[0]?.email).toBe(f.actor.email);
  const payload = (await pool.query('SELECT payload FROM administrator_code_challenges')).rows[0]
    .payload;
  expect(payload.code).toBeUndefined();
  expect(payload.hash).toHaveLength(64);
  expect(payload.recipient).toBe(f.actor.email);
  expect(required(await f.repository.read(f.actor)).emailEnabled).toBe(false);
  required(
    await f.repository.mutate(f.actor, {
      action: 'email-confirm',
      code: f.messages[0]?.code ?? '',
    }),
  );
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    emailEnabled: true,
    enabled: false,
  });
  expect(
    (
      await f.repository.mutate(f.actor, {
        action: 'email-confirm',
        code: f.messages[0]?.code ?? '',
      })
    ).ok,
  ).toBe(false);
});
it('binds e-mail challenges to their login session and recipient and consumes a valid code only once under concurrency', async () => {
  const f = await codeFixture();
  await prepareEmail(f);
  await pool.query(
    "UPDATE administrator_code_factors SET email_sent_at=now()-interval '61 seconds'",
  );
  const actor = await securitySession(f.actor),
    other = await securitySession(f.actor);
  required(await f.repository.mutate(actor, { action: 'email-send' }));
  const code = f.messages.at(-1)?.code ?? '';
  expect((await f.repository.mutate(other, { action: 'email-verify', code })).ok).toBe(false);
  const results = await Promise.all([
    f.repository.mutate(actor, { action: 'email-verify', code }),
    f.repository.mutate(actor, { action: 'email-verify', code }),
  ]);
  expect(results.filter((r) => r.ok)).toHaveLength(1);
  expect(
    (
      await f.repository.mutate(
        { ...actor, email: 'changed@example.invalid' },
        { action: 'email-send' },
      )
    ).ok,
  ).toBe(false);
});
it('expires e-mail codes, throttles resends and locks attempts without rolling counters back', async () => {
  const f = await codeFixture();
  await prepareEmail(f);
  const actor = await securitySession(f.actor);
  const cooldown = await f.repository.mutate(actor, { action: 'email-send' });
  expect(cooldown.ok ? null : cooldown.error.code).toBe('RATE_LIMITED');
  await pool.query(
    "UPDATE administrator_code_factors SET email_sent_at=now()-interval '61 seconds'",
  );
  required(await f.repository.mutate(actor, { action: 'email-send' }));
  const code = f.messages.at(-1)?.code ?? '';
  await pool.query("UPDATE administrator_code_challenges SET expires_at=now()-interval '1 second'");
  expect((await f.repository.mutate(actor, { action: 'email-verify', code })).ok).toBe(false);
  for (let index = 0; index < 5; index++)
    await f.repository.mutate(actor, { action: 'email-verify', code });
  expect(
    (
      await pool.query(
        'SELECT failures,locked_until>now() AS locked FROM administrator_code_factors',
      )
    ).rows[0],
  ).toMatchObject({ failures: 6, locked: true });
});
it('does not announce an accepted e-mail or leave an active setup after delivery API failure', async () => {
  const f = await codeFixture();
  f.mail.failed = true;
  expect(
    (await f.repository.mutate(f.actor, { action: 'email-prepare', password: 'test-only' })).ok,
  ).toBe(false);
  expect((await pool.query('SELECT 1 FROM administrator_code_challenges')).rowCount).toBe(0);
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: false,
    emailEnabled: false,
  });
  expect(f.messages).toHaveLength(0);
});
it('clears both code factors, pending challenges and session grants when protection is explicitly disabled', async () => {
  const f = await codeFixture();
  await prepareTotp(f);
  await prepareEmail(f, false);
  required(await f.repository.mutate(f.actor, { action: 'disable', password: 'test-only' }));
  expect(required(await f.repository.read(f.actor))).toMatchObject({
    enabled: false,
    totpEnabled: false,
    emailEnabled: false,
    verified: false,
  });
  expect((await pool.query('SELECT 1 FROM administrator_code_challenges')).rowCount).toBe(0);
  expect((await pool.query('SELECT 1 FROM administrator_code_factors')).rowCount).toBe(0);
});
