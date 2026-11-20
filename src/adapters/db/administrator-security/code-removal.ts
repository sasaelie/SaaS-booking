import { sql } from 'drizzle-orm';
import type { Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { securityAccess, requireFreshVerification } from './access';
import { readCredentials, auditSecurity } from './credentials';
import { codeFactorState } from './code-state';
export async function removeCodeMethod(
  tx: Transaction,
  actor: PortalActor,
  method: 'totp' | 'email',
) {
  await requireFreshVerification(tx, actor);
  const state = await codeFactorState(tx, actor),
    keys = await readCredentials(tx, actor);
  const enabled = method === 'totp' ? state.totpEnabled : state.emailEnabled,
    other = method === 'totp' ? state.emailEnabled : state.totpEnabled;
  if (!enabled || ((await securityAccess(tx, actor)).enabled && !other && !keys.length))
    return failure(ERROR_CODES.CONFLICT, 'AdministratorCodes', 'lastMethod');
  if (method === 'totp') {
    await tx.execute(
      sql`UPDATE administrator_code_factors SET totp_ciphertext=NULL,last_step=-1 WHERE user_id=${actor.id}`,
    );
    await tx.execute(
      sql`DELETE FROM administrator_code_challenges WHERE user_id=${actor.id} AND purpose='totp-enroll'`,
    );
  } else {
    await tx.execute(
      sql`UPDATE administrator_code_factors SET email_address=NULL WHERE user_id=${actor.id}`,
    );
    await tx.execute(
      sql`DELETE FROM administrator_code_challenges WHERE user_id=${actor.id} AND purpose IN ('email-enroll','email-verify')`,
    );
  }
  await tx.execute(
    sql`DELETE FROM administrator_verified_sessions WHERE user_id=${actor.id} AND session_id<>${actor.sessionId}`,
  );
  await auditSecurity(
    tx,
    actor,
    method === 'totp' ? 'ADMINISTRATOR_TOTP_REMOVED' : 'ADMINISTRATOR_EMAIL_REMOVED',
  );
  return ok({});
}
