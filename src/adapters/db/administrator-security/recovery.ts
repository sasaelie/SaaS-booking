import { createHash, randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalActor } from '../../../core/ports/portal-models';
import { rows, required, type Transaction } from '../transaction';
export function recoveryHash(userId: string, code: string) {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex');
}
export async function replaceRecovery(tx: Transaction, actor: PortalActor) {
  const codes = Array.from({ length: C.CODE_COUNT }, () =>
    randomBytes(C.CODE_BYTES).toString('hex').toUpperCase(),
  );
  await tx.execute(sql`DELETE FROM administrator_recovery_codes WHERE user_id=${actor.id}`);
  for (const code of codes)
    await tx.execute(
      sql`INSERT INTO administrator_recovery_codes(user_id,code_hash) VALUES(${actor.id},${recoveryHash(actor.id, code)})`,
    );
  return codes.map((code) => code.match(new RegExp(`.{${C.CODE_GROUP}}`, 'g'))?.join('-') ?? code);
}
export async function consumeRecovery(tx: Transaction, actor: PortalActor, code: string) {
  const used = await rows(
    tx,
    sql`DELETE FROM administrator_recovery_codes WHERE user_id=${actor.id} AND code_hash=${recoveryHash(actor.id, code)} RETURNING user_id`,
  );
  if (!used.length)
    required(failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'recovery'));
}
export async function validateRecovery(tx: Transaction, actor: PortalActor, code: string) {
  const found = await rows(
    tx,
    sql`SELECT user_id FROM administrator_recovery_codes WHERE user_id=${actor.id} AND code_hash=${recoveryHash(actor.id, code)}`,
  );
  if (!found.length)
    required(failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'recoveryConfirmation'));
}
