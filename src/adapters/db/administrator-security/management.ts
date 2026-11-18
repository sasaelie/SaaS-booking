import { sql } from 'drizzle-orm';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { AdministratorSecurityCommand } from '../../../core/validation/administrator-security';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import type { Transaction } from '../transaction';
import { consumeRecovery, replaceRecovery, validateRecovery } from './recovery';
import { requireFreshVerification, markVerified, securityAccess } from './access';
import { readCredentials, auditSecurity } from './credentials';
type Command = Exclude<
  AdministratorSecurityCommand,
  {
    action: 'register-options' | 'register-finish' | 'authenticate-options' | 'authenticate-finish';
  }
>;
export async function manageSecurity(tx: Transaction, actor: PortalActor, command: Command) {
  const state = await securityAccess(tx, actor);
  if (command.action === 'recover') {
    if (!state.enabled)
      return failure(ERROR_CODES.CONFLICT, 'AdministratorSecurity', 'inactiveRecovery');
    await consumeRecovery(tx, actor, command.code);
    await markVerified(tx, actor);
    await auditSecurity(tx, actor, 'ADMINISTRATOR_RECOVERY_USED');
    return ok({});
  }
  await requireFreshVerification(tx, actor);
  if (command.action === 'activate') {
    if (state.enabled || !(await readCredentials(tx, actor)).length)
      return failure(ERROR_CODES.CONFLICT, 'AdministratorSecurity', 'activation');
    await validateRecovery(tx, actor, command.code);
    await tx.execute(
      sql`UPDATE administrator_security SET enabled=true,updated_at=now() WHERE user_id=${actor.id}`,
    );
    await tx.execute(
      sql`DELETE FROM administrator_verified_sessions WHERE user_id=${actor.id} AND session_id<>${actor.sessionId}`,
    );
    await auditSecurity(tx, actor, 'ADMINISTRATOR_SECURITY_ENABLED');
    return ok({});
  }
  if (command.action === 'rotate-recovery') {
    const recoveryCodes = await replaceRecovery(tx, actor);
    await tx.execute(
      sql`DELETE FROM administrator_verified_sessions WHERE user_id=${actor.id} AND session_id<>${actor.sessionId}`,
    );
    await auditSecurity(tx, actor, 'ADMINISTRATOR_RECOVERY_REPLACED');
    return ok({ recoveryCodes });
  }
  return command.action === 'remove' || command.action === 'disable'
    ? removeSecurity(tx, actor, command, state.enabled)
    : failure(ERROR_CODES.VALIDATION_FAILED, 'AdministratorSecurity', 'command');
}
async function removeSecurity(
  tx: Transaction,
  actor: PortalActor,
  command: Extract<
    AdministratorSecurityCommand,
    { action: 'remove' | 'rotate-recovery' | 'disable' }
  >,
  enabled: boolean,
) {
  if (command.action === 'remove') {
    const keys = await readCredentials(tx, actor);
    if (!keys.some((k) => k.id === command.credentialId) || (enabled && keys.length <= 1))
      return failure(ERROR_CODES.CONFLICT, 'AdministratorSecurity', 'lastCredential');
    await tx.execute(
      sql`DELETE FROM administrator_passkeys WHERE credential_id=${command.credentialId} AND user_id=${actor.id}`,
    );
    await tx.execute(
      sql`DELETE FROM administrator_verified_sessions WHERE user_id=${actor.id} AND session_id<>${actor.sessionId}`,
    );
    await auditSecurity(tx, actor, 'ADMINISTRATOR_PASSKEY_REMOVED');
    return ok({});
  }
  for (const table of [
    'administrator_passkeys',
    'administrator_recovery_codes',
    'administrator_verified_sessions',
    'administrator_challenges',
  ])
    await tx.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE user_id=${actor.id}`);
  await tx.execute(
    sql`UPDATE administrator_security SET enabled=false,updated_at=now() WHERE user_id=${actor.id}`,
  );
  await auditSecurity(tx, actor, 'ADMINISTRATOR_SECURITY_DISABLED');
  return ok({});
}
