import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { Transaction } from '../transaction';
import { rows } from '../transaction';
const payloadSchema = z
  .object({
    ciphertext: z.string().optional(),
    hash: z.string().optional(),
    nonce: z.string().optional(),
    recipient: z.string().optional(),
  })
  .strict();
export type CodeChallengePayload = z.output<typeof payloadSchema>;
export async function saveCodeChallenge(
  tx: Transaction,
  actor: PortalActor,
  purpose: string,
  payload: CodeChallengePayload,
  seconds: number,
) {
  await tx.execute(
    sql`INSERT INTO administrator_code_challenges(session_id,user_id,purpose,payload,expires_at) VALUES(${actor.sessionId},${actor.id},${purpose},${JSON.stringify(payload)}::jsonb,now()+make_interval(secs=>${seconds})) ON CONFLICT(session_id,purpose) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at`,
  );
}
export async function readCodeChallenge(tx: Transaction, actor: PortalActor, purpose: string) {
  const [row] = await rows<{ payload: unknown }>(
    tx,
    sql`SELECT payload FROM administrator_code_challenges WHERE session_id=${actor.sessionId} AND user_id=${actor.id} AND purpose=${purpose} AND expires_at>now() FOR UPDATE`,
  );
  return row ? payloadSchema.parse(row.payload) : null;
}
export async function deleteCodeChallenge(tx: Transaction, actor: PortalActor, purpose: string) {
  await tx.execute(
    sql`DELETE FROM administrator_code_challenges WHERE session_id=${actor.sessionId} AND user_id=${actor.id} AND purpose=${purpose}`,
  );
}
