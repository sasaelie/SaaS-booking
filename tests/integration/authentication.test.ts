import { expect, it } from 'vitest';
import { pool } from './database';
import { createApplicationAuth } from '../../src/adapters/auth/application-auth';
import { SessionIdentityAdapter } from '../../src/adapters/auth/session-identity.adapter';
const origin = 'http://localhost:3002';
function authFixture() {
  const messages: { url: string; reset: boolean }[] = [];
  const auth = createApplicationAuth(
    pool,
    {
      DATABASE_URL: process.env['TEST_DATABASE_URL'] ?? '',
      NEXT_PUBLIC_APP_URL: origin,
      SELF_CANCEL_HMAC_SECRET: 'self_test_only_not_for_production_123456789',
    },
    'auth_test_only_not_for_production_123456789',
    async (_to, url, reset) => {
      messages.push({ url, reset });
    },
  );
  return { auth, messages };
}
function post(auth: ReturnType<typeof createApplicationAuth>, path: string, body: unknown) {
  return auth.handler(
    new Request(`${origin}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(body),
    }),
  );
}
function cookieHeaders(response: Response) {
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
  return new Headers({ cookie });
}
it('verifies email, authenticates a real cookie and revokes sessions after password reset', async () => {
  const { auth, messages } = authFixture();
  const email = `${crypto.randomUUID()}@example.com`;
  const password = 'Test-only-password-12345!';
  const registered = await post(auth, 'sign-up/email', {
    email,
    password,
    name: 'Responsable Test',
    callbackURL: `${origin}/app`,
  });
  expect(registered.status).toBe(200);
  expect(messages).toHaveLength(1);
  const verification = messages.find((message) => !message.reset);
  expect(verification).toBeDefined();
  if (!verification) return;
  expect((await auth.handler(new Request(verification.url))).status).toBe(302);
  const logged = await post(auth, 'sign-in/email', { email, password });
  expect(logged.status).toBe(200);
  const headers = cookieHeaders(logged);
  const identity = new SessionIdentityAdapter(auth, headers);
  expect((await identity.current()).ok).toBe(true);
  const forged = new SessionIdentityAdapter(
    auth,
    new Headers({ cookie: 'better-auth.session_token=forged' }),
  );
  expect((await forged.current()).ok).toBe(false);
  await resetPassword(auth, messages, email);
  expect((await identity.current()).ok).toBe(false);
  expect((await post(auth, 'sign-in/email', { email, password })).ok).toBe(false);
  expect(
    (await post(auth, 'sign-in/email', { email, password: 'Replacement-password-12345!' })).ok,
  ).toBe(true);
});

async function resetPassword(
  auth: ReturnType<typeof createApplicationAuth>,
  messages: { url: string; reset: boolean }[],
  email: string,
) {
  await post(auth, 'request-password-reset', {
    email,
    redirectTo: `${origin}/nouveau-mot-de-passe`,
  });
  const reset = messages.find((message) => message.reset);
  expect(reset).toBeDefined();
  if (!reset) return;
  const token = new URL(reset.url).pathname.split('/').pop();
  expect(
    (await post(auth, 'reset-password', { token, newPassword: 'Replacement-password-12345!' }))
      .status,
  ).toBe(200);
}

it('does not authenticate a newly registered account before email verification', async () => {
  const { auth } = authFixture();
  const email = `${crypto.randomUUID()}@example.com`;
  const password = 'Unverified-password-12345!';
  expect((await post(auth, 'sign-up/email', { email, password, name: 'Test' })).status).toBe(200);
  expect((await post(auth, 'sign-in/email', { email, password })).status).toBe(403);
});
