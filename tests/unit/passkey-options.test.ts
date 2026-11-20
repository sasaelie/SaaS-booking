import { expect, it } from 'vitest';
import { SimpleWebAuthnAdapter } from '../../src/adapters/auth/simple-webauthn.adapter';
import {
  PasskeyRegistrationSchema,
  PasskeyAuthenticationSchema,
} from '../../src/core/validation/administrator-security';
const adapter = new SimpleWebAuthnAdapter('https://administration.example.invalid');
it('requests a resident platform credential with mandatory user verification and fresh challenges', async () => {
  const actor = { id: 'local-test-user', name: 'Test', email: 'test@example.invalid' };
  const a = await adapter.registerOptions(actor, []),
    b = await adapter.registerOptions(actor, []);
  expect(a.options.authenticatorSelection).toMatchObject({
    authenticatorAttachment: 'platform',
    residentKey: 'required',
    userVerification: 'required',
  });
  expect(a.options.rp).toMatchObject({ id: 'administration.example.invalid' });
  expect(a.challenge).not.toBe(b.challenge);
});
it('requires local verification and limits authentication options to the stored credentials', async () => {
  const options = await adapter.authenticateOptions([
    { id: 'only-this-key', publicKey: 'key', counter: 0, transports: ['internal'] },
  ]);
  expect(options.options.userVerification).toBe('required');
  expect(options.options.allowCredentials).toEqual([
    { id: 'only-this-key', type: 'public-key', transports: ['internal'] },
  ]);
});
it('refuses unverified registration and authentication payloads instead of trusting client success flags', async () => {
  const base = { id: 'dGVzdA', rawId: 'dGVzdA', type: 'public-key', clientExtensionResults: {} };
  const register = PasskeyRegistrationSchema.parse({
    ...base,
    response: { clientDataJSON: 'dGVzdA', attestationObject: 'dGVzdA' },
  });
  expect((await adapter.register(register, 'expected-challenge')).ok).toBe(false);
  const authenticate = PasskeyAuthenticationSchema.parse({
    ...base,
    response: { clientDataJSON: 'dGVzdA', authenticatorData: 'dGVzdA', signature: 'dGVzdA' },
  });
  expect(
    (
      await adapter.authenticate(authenticate, 'expected-challenge', {
        id: base.id,
        publicKey: 'dGVzdA',
        counter: 0,
        transports: [],
      })
    ).ok,
  ).toBe(false);
});
