import { sql } from 'drizzle-orm';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { PasskeyGatewayPort } from '../../../core/ports/administrator-security';
import type { AdministratorSecurityCommand } from '../../../core/validation/administrator-security';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { rows, required, type Transaction } from '../transaction';
import { markVerified, requireFreshVerification, securityAccess } from './access';
import { readCredentials, auditSecurity } from './credentials';
import { replaceRecovery } from './recovery';
type OptionsCommand = Extract<
  AdministratorSecurityCommand,
  { action: 'register-options' | 'authenticate-options' }
>;
type FinishCommand = Extract<
  AdministratorSecurityCommand,
  { action: 'register-finish' | 'authenticate-finish' }
>;
export async function startCeremony(
  tx: Transaction,
  actor: PortalActor,
  command: OptionsCommand,
  gateway: PasskeyGatewayPort,
) {
  const keys = await readCredentials(tx, actor),
    registering = command.action === 'register-options';
  if (registering && (await securityAccess(tx, actor)).enabled)
    await requireFreshVerification(tx, actor);
  if (registering ? keys.length >= C.KEY_MAX : !keys.length)
    return failure(ERROR_CODES.CONFLICT, 'AdministratorSecurity', 'credentials');
  const generated = registering
    ? await gateway.registerOptions(actor, keys)
    : await gateway.authenticateOptions(keys);
  const purpose = registering ? 'register' : 'authenticate';
  await tx.execute(sql`INSERT INTO administrator_challenges(session_id,user_id,purpose,challenge,label,expires_at)
    VALUES(${actor.sessionId},${actor.id},${purpose},${generated.challenge},${'label' in command ? command.label : ''},now()+make_interval(secs=>${C.CHALLENGE_SECONDS}))
    ON CONFLICT(session_id,purpose) DO UPDATE SET challenge=excluded.challenge,label=excluded.label,expires_at=excluded.expires_at`);
  return ok({ options: generated.options });
}
export async function finishCeremony(
  tx: Transaction,
  actor: PortalActor,
  command: FinishCommand,
  gateway: PasskeyGatewayPort,
) {
  const registering = command.action === 'register-finish';
  const [challenge] = await rows<{ challenge: string; label: string }>(
    tx,
    sql`DELETE FROM administrator_challenges
    WHERE session_id=${actor.sessionId} AND user_id=${actor.id} AND purpose=${registering ? 'register' : 'authenticate'} AND expires_at>now() RETURNING challenge,label`,
  );
  if (!challenge) return failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'challenge');
  const keys = await readCredentials(tx, actor);
  if (command.action === 'register-finish') {
    if ((await securityAccess(tx, actor)).enabled) await requireFreshVerification(tx, actor);
    if (keys.length >= C.KEY_MAX)
      return failure(ERROR_CODES.CONFLICT, 'AdministratorSecurity', 'credentials');
    const credential = required(await gateway.register(command.response, challenge.challenge));
    await tx.execute(sql`INSERT INTO administrator_passkeys(credential_id,user_id,public_key,counter,transports,label)
      VALUES(${credential.id},${actor.id},${credential.publicKey},${credential.counter},${JSON.stringify(credential.transports)}::jsonb,${challenge.label})`);
    await markVerified(tx, actor);
    await auditSecurity(tx, actor, 'ADMINISTRATOR_PASSKEY_ADDED');
    return ok(keys.length ? {} : { recoveryCodes: await replaceRecovery(tx, actor) });
  }
  const credential = keys.find((key) => key.id === command.response.id);
  if (!credential)
    return failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'credentialOwner');
  const counter = required(
    await gateway.authenticate(command.response, challenge.challenge, credential),
  );
  await tx.execute(
    sql`UPDATE administrator_passkeys SET counter=${counter} WHERE credential_id=${credential.id} AND user_id=${actor.id}`,
  );
  await markVerified(tx, actor);
  await auditSecurity(tx, actor, 'ADMINISTRATOR_DEVICE_VERIFIED');
  return ok({});
}
