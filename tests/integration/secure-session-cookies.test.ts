import { expect, it } from 'vitest';
import { hashPassword } from 'better-auth/crypto';
import { pool } from './database';
import { portalFixture } from './portal-fixtures';
import { createApplicationAuth } from '../../src/adapters/auth/application-auth';
it('issues host-scoped HttpOnly Secure cookies for an HTTPS deployment', async () => {
  const { actor } = await portalFixture();
  const password = 'Local-secure-session-test-password-12345!';
  await pool.query(
    'INSERT INTO account(id,"accountId","providerId","userId",password) VALUES($1,$2,$3,$2,$4)',
    [crypto.randomUUID(), actor.id, 'credential', await hashPassword(password)],
  );
  const origin = 'https://secure.example.invalid';
  const auth = createApplicationAuth(
    pool,
    {
      DATABASE_URL: process.env['TEST_DATABASE_URL'] ?? '',
      NEXT_PUBLIC_APP_URL: origin,
      SELF_CANCEL_HMAC_SECRET: 'test-only-secret-long-enough-123456789',
    },
    'test-only-auth-secret-long-enough-123456789',
    async () => undefined,
  );
  const response = await auth.handler(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: actor.email, password }),
    }),
  );
  expect(response.status).toBe(200);
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((value) => value.includes('session_token='));
  expect(session).toBeDefined();
  expect(session).toMatch(/;\s*HttpOnly/i);
  expect(session).toMatch(/;\s*Secure/i);
  expect(session).toMatch(/;\s*SameSite=Lax/i);
  expect(session).not.toMatch(/;\s*Domain=/i);
});
