import { sql } from 'drizzle-orm';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { AdministratorOtpPort } from '../../../core/ports/administrator-codes';
import type { AdministratorCodeCommand } from '../../../core/validation/administrator-codes';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import { ok } from '../../../lib/result';
import { rows, required, type Transaction } from '../transaction';
import { securityAccess, requireFreshVerification, markVerified } from './access';
import { saveCodeChallenge, readCodeChallenge, deleteCodeChallenge } from './code-challenges';
import { codeLock, failCode, clearCodeFailures } from './code-state';
import { ensureRecovery } from './recovery';
import { auditSecurity } from './credentials';
type Command = Extract<
  AdministratorCodeCommand,
  { action: 'totp-prepare' | 'totp-confirm' | 'totp-verify' }
>;
export async function totpCommand(
  tx: Transaction,
  actor: PortalActor,
  command: Command,
  otp: AdministratorOtpPort,
) {
  if (command.action === 'totp-prepare') return prepareTotp(tx, actor, otp);
  const lock = await codeLock(tx, actor);
  if (!lock.ok) return lock;
  const enrolling = command.action === 'totp-confirm';
  if (enrolling && (await securityAccess(tx, actor)).enabled)
    await requireFreshVerification(tx, actor);
  const [current] = await rows<{ ciphertext: string | null; lastStep: number }>(
    tx,
    sql`SELECT totp_ciphertext AS ciphertext,last_step::float8 AS "lastStep" FROM administrator_code_factors WHERE user_id=${actor.id}`,
  );
  const pending = enrolling ? await readCodeChallenge(tx, actor, 'totp-enroll') : null;
  const ciphertext = enrolling ? pending?.ciphertext : current?.ciphertext;
  if (!ciphertext) return failCode(tx, actor);
  const verified = await otp.verifyTotp(
    actor.id,
    ciphertext,
    command.code,
    enrolling ? C.INITIAL_COUNTER : (current?.lastStep ?? C.INITIAL_COUNTER),
  );
  if (!verified.ok) return failCode(tx, actor);
  return finishTotp(tx, actor, enrolling, ciphertext, verified.value);
}

async function prepareTotp(tx: Transaction, actor: PortalActor, otp: AdministratorOtpPort) {
  if ((await securityAccess(tx, actor)).enabled) await requireFreshVerification(tx, actor);
  const prepared = required(await otp.prepareTotp(actor.id));
  await saveCodeChallenge(
    tx,
    actor,
    'totp-enroll',
    { ciphertext: prepared.ciphertext },
    C.SETUP_SECONDS,
  );
  return ok({ totpSecret: prepared.secret });
}

async function finishTotp(
  tx: Transaction,
  actor: PortalActor,
  enrolling: boolean,
  ciphertext: string,
  step: number,
) {
  await tx.execute(
    sql`UPDATE administrator_code_factors SET totp_ciphertext=${ciphertext},last_step=${step} WHERE user_id=${actor.id}`,
  );
  await clearCodeFailures(tx, actor);
  await markVerified(tx, actor);
  if (enrolling) {
    await deleteCodeChallenge(tx, actor, 'totp-enroll');
    await tx.execute(
      sql`DELETE FROM administrator_verified_sessions WHERE user_id=${actor.id} AND session_id<>${actor.sessionId}`,
    );
  }
  await auditSecurity(
    tx,
    actor,
    enrolling ? 'ADMINISTRATOR_TOTP_CONFIGURED' : 'ADMINISTRATOR_TOTP_VERIFIED',
  );
  return ok(enrolling ? await ensureRecovery(tx, actor) : {});
}
