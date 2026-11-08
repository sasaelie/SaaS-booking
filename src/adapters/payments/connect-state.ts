import { sql } from 'drizzle-orm';
import { randomBytes, createHash } from 'node:crypto';
import type { DrizzlePgDb } from '../db/client';
import { atomic, rows } from '../db/transaction';
import { requireMembership } from '../db/portal/authorization';
import type { PortalActor } from '../../core/ports/portal-models';
import { SAAS, TIME, ERROR_CODES } from '../../config/constants';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
export function createConnectState(db: DrizzlePgDb, actor: PortalActor, id: string) {
  return atomic(db, 'Connect', async (tx) => {
    await requireMembership(tx, actor, id, true);
    const token = randomBytes(SAAS.OAUTH_STATE_BYTES).toString('base64url');
    await tx.execute(
      sql`DELETE FROM stripe_connect_states WHERE organization_id=${id} AND user_id=${actor.id}`,
    );
    await tx.execute(
      sql`INSERT INTO stripe_connect_states(token_hash,organization_id,user_id,expires_at) VALUES(${hash(token)},${id},${actor.id},${new Date(Date.now() + SAAS.OAUTH_STATE_MINUTES * TIME.MINUTE_MS).toISOString()})`,
    );
    return ok(token);
  });
}
export function consumeConnectState(db: DrizzlePgDb, actor: PortalActor, token: string) {
  return atomic(db, 'Connect', async (tx) => {
    const [row] = await rows<{ organization_id: string }>(
      tx,
      sql`DELETE FROM stripe_connect_states WHERE token_hash=${hash(token)} AND user_id=${actor.id} AND expires_at>clock_timestamp() RETURNING organization_id`,
    );
    if (!row) return failure(ERROR_CODES.UNAUTHORIZED, 'Connect', 'state');
    await requireMembership(tx, actor, row.organization_id, true);
    return ok(row.organization_id);
  });
}
