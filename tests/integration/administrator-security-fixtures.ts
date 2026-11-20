import { randomBytes } from 'node:crypto';
import type { PasskeyGatewayPort } from '../../src/core/ports/administrator-security';
import type { PortalActor } from '../../src/core/ports/portal-models';
import {
  PasskeyRegistrationSchema,
  PasskeyAuthenticationSchema,
} from '../../src/core/validation/administrator-security';
import { DrizzleAdministratorSecurityRepository } from '../../src/adapters/db/drizzle-administrator-security.repository';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import { portalFixture } from './portal-fixtures';
import { db, pool } from './database';
export async function securitySession(actor: PortalActor) {
  const sessionId = crypto.randomUUID();
  await pool.query(
    'INSERT INTO "session"(id,token,"userId","expiresAt") VALUES($1,$2,$3,now()+interval \'1 day\')',
    [sessionId, crypto.randomUUID(), actor.id],
  );
  return { ...actor, sessionId };
}
export async function securityFixture() {
  const fixture = await portalFixture(true),
    actor = await securitySession(fixture.actor);
  const id = randomBytes(32).toString('base64url');
  const options = async () => {
    const challenge = randomBytes(32).toString('base64url');
    return { challenge, options: { challenge } };
  };
  const gateway: PasskeyGatewayPort = {
    registerOptions: options,
    authenticateOptions: options,
    register: async () =>
      ok({ id, publicKey: 'test_public_key', counter: 0, transports: ['internal'] }),
    authenticate: async () => ok(1),
  };
  return {
    ...fixture,
    actor,
    id,
    repository: new DrizzleAdministratorSecurityRepository(db, gateway),
  };
}
export const registrationResponse = () =>
  PasskeyRegistrationSchema.parse({
    id: 'test_credential',
    rawId: 'test_credential',
    type: 'public-key',
    clientExtensionResults: {},
    response: { clientDataJSON: 'dGVzdA', attestationObject: 'dGVzdA', transports: ['internal'] },
  });
export const authenticationResponse = (id: string) =>
  PasskeyAuthenticationSchema.parse({
    id,
    rawId: id,
    type: 'public-key',
    clientExtensionResults: {},
    response: { clientDataJSON: 'dGVzdA', authenticatorData: 'dGVzdA', signature: 'dGVzdA' },
  });
export async function prepareSecurity(
  f: Awaited<ReturnType<typeof securityFixture>>,
  activate = true,
) {
  required(
    await f.repository.mutate(f.actor, {
      action: 'register-options',
      password: 'test-only',
      label: 'Téléphone de test',
    }),
  );
  const result = required(
    await f.repository.mutate(f.actor, {
      action: 'register-finish',
      response: registrationResponse(),
    }),
  );
  const codes = result.recoveryCodes ?? [];
  if (activate)
    required(
      await f.repository.mutate(f.actor, {
        action: 'activate',
        code: (codes[0] ?? '').replaceAll('-', ''),
      }),
    );
  return codes.map((c) => c.replaceAll('-', ''));
}
