import { sql } from 'drizzle-orm';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { Executor, Transaction } from '../transaction';
import { rows } from '../transaction';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import { ERROR_CODES, TIME } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
export async function codeFactorState(db: Executor, actor: PortalActor) {
  const [state] = await rows<{
    totpEnabled: boolean;
    emailEnabled: boolean;
    emailNextSendAt: number | null;
  }>(
    db,
    sql`
    SELECT totp_ciphertext IS NOT NULL AS "totpEnabled",email_address=${actor.email} AS "emailEnabled",
    CASE WHEN email_sent_at>now()-make_interval(secs=>${C.EMAIL_COOLDOWN_SECONDS}) THEN (extract(epoch FROM email_sent_at+make_interval(secs=>${C.EMAIL_COOLDOWN_SECONDS}))*${TIME.SECOND_MS})::float8 ELSE NULL END AS "emailNextSendAt"
    FROM administrator_code_factors WHERE user_id=${actor.id}`,
  );
  return {
    totpEnabled: state?.totpEnabled ?? false,
    emailEnabled: state?.emailEnabled ?? false,
    emailNextSendAt: state?.emailNextSendAt ? new Date(state.emailNextSendAt).toISOString() : null,
  };
}
export async function hasCodeFactor(db: Executor, actor: PortalActor) {
  const state = await codeFactorState(db, actor);
  return state.totpEnabled || state.emailEnabled;
}
export async function initializeCodeState(tx: Transaction, actor: PortalActor) {
  await tx.execute(
    sql`INSERT INTO administrator_code_factors(user_id) VALUES(${actor.id}) ON CONFLICT DO NOTHING`,
  );
  await tx.execute(
    sql`UPDATE administrator_code_factors SET failures=0,locked_until=NULL WHERE user_id=${actor.id} AND locked_until<=now()`,
  );
}
export async function codeLock(tx: Transaction, actor: PortalActor) {
  const [record] = await rows<{ locked: boolean }>(
    tx,
    sql`SELECT COALESCE(locked_until>now(),false) AS locked FROM administrator_code_factors WHERE user_id=${actor.id}`,
  );
  return record?.locked
    ? failure(ERROR_CODES.OTP_LOCKED, 'AdministratorCodes', 'locked')
    : ok(undefined);
}
export async function failCode(tx: Transaction, actor: PortalActor) {
  const [record] = await rows<{ failures: number }>(
    tx,
    sql`UPDATE administrator_code_factors SET failures=LEAST(failures+1,${C.MAX_FAILURES}),locked_until=CASE WHEN failures+1>=${C.MAX_FAILURES} THEN now()+make_interval(secs=>${C.LOCK_SECONDS}) ELSE locked_until END WHERE user_id=${actor.id} RETURNING failures`,
  );
  return failure(
    (record?.failures ?? 0) >= C.MAX_FAILURES ? ERROR_CODES.OTP_LOCKED : ERROR_CODES.OTP_INVALID,
    'AdministratorCodes',
    'code',
  );
}
export async function clearCodeFailures(tx: Transaction, actor: PortalActor) {
  await tx.execute(
    sql`UPDATE administrator_code_factors SET failures=0,locked_until=NULL,updated_at=now() WHERE user_id=${actor.id}`,
  );
}
