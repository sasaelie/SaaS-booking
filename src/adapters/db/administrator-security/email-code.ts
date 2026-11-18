import { sql } from 'drizzle-orm';
import type { PortalActor } from '../../../core/ports/portal-models';
import type {
  AdministratorOtpPort,
  AdministratorCodeMailPort,
} from '../../../core/ports/administrator-codes';
import type { AdministratorCodeCommand } from '../../../core/validation/administrator-codes';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import { ERROR_CODES, TIME } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { rows, required, type Transaction } from '../transaction';
import { requireFreshVerification, securityAccess, markVerified } from './access';
import { saveCodeChallenge, readCodeChallenge, deleteCodeChallenge } from './code-challenges';
import { codeFactorState, codeLock, failCode, clearCodeFailures } from './code-state';
import { ensureRecovery } from './recovery';
import { auditSecurity } from './credentials';
type SendCommand = Extract<AdministratorCodeCommand, { action: 'email-prepare' | 'email-send' }>;
type VerifyCommand = Extract<
  AdministratorCodeCommand,
  { action: 'email-confirm' | 'email-verify' }
>;
export async function sendEmailCode(
  tx: Transaction,
  actor: PortalActor,
  command: SendCommand,
  otp: AdministratorOtpPort,
  mail: AdministratorCodeMailPort,
) {
  if (!mail.available)
    return failure(ERROR_CODES.CONFIGURATION_ERROR, 'AdministratorCodes', 'mail');
  const enrolling = command.action === 'email-prepare',
    state = await codeFactorState(tx, actor);
  if (enrolling && (await securityAccess(tx, actor)).enabled)
    await requireFreshVerification(tx, actor);
  if (!enrolling && !state.emailEnabled)
    return failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorCodes', 'emailMethod');
  if (state.emailNextSendAt)
    return failure(ERROR_CODES.RATE_LIMITED, 'AdministratorCodes', 'cooldown');
  const purpose = enrolling ? 'email-enroll' : 'email-verify',
    proof = otp.prepareEmail(actor, purpose);
  required(await mail.send(actor, proof.code, 'administrator-code:' + proof.nonce));
  await saveCodeChallenge(
    tx,
    actor,
    purpose,
    { hash: proof.hash, nonce: proof.nonce, recipient: actor.email },
    C.EMAIL_SECONDS,
  );
  const [record] = await rows<{ next: number }>(
    tx,
    sql`UPDATE administrator_code_factors SET email_sent_at=now() WHERE user_id=${actor.id} RETURNING (extract(epoch FROM email_sent_at+make_interval(secs=>${C.EMAIL_COOLDOWN_SECONDS}))*${TIME.SECOND_MS})::float8 AS next`,
  );
  return ok({
    emailSent: true,
    emailNextSendAt: record ? new Date(record.next).toISOString() : undefined,
  });
}
export async function verifyEmailCode(
  tx: Transaction,
  actor: PortalActor,
  command: VerifyCommand,
  otp: AdministratorOtpPort,
) {
  const lock = await codeLock(tx, actor);
  if (!lock.ok) return lock;
  const enrolling = command.action === 'email-confirm',
    purpose = enrolling ? 'email-enroll' : 'email-verify';
  if (enrolling && (await securityAccess(tx, actor)).enabled)
    await requireFreshVerification(tx, actor);
  if (!enrolling && !(await codeFactorState(tx, actor)).emailEnabled) return failCode(tx, actor);
  const challenge = await readCodeChallenge(tx, actor, purpose);
  if (
    !challenge?.hash ||
    !challenge.nonce ||
    challenge.recipient !== actor.email ||
    !otp.verifyEmail(actor, purpose, command.code, challenge.nonce, challenge.hash)
  )
    return failCode(tx, actor);
  await deleteCodeChallenge(tx, actor, purpose);
  await clearCodeFailures(tx, actor);
  if (enrolling)
    await tx.execute(
      sql`UPDATE administrator_code_factors SET email_address=${actor.email} WHERE user_id=${actor.id}`,
    );
  await markVerified(tx, actor);
  await auditSecurity(
    tx,
    actor,
    enrolling ? 'ADMINISTRATOR_EMAIL_CONFIGURED' : 'ADMINISTRATOR_EMAIL_VERIFIED',
  );
  return ok(enrolling ? await ensureRecovery(tx, actor) : {});
}
