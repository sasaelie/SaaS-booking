import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../db/client';
import { atomic, rows, type Executor } from '../db/transaction';
import { DatabaseSchema } from '../../config/database';
import { ERROR_CODES } from '../../config/constants';
import type { PortalActor } from '../../core/ports/portal-models';
import type { SimulationParticipantLoginPort } from '../../core/ports/simulation-participant-login.port';
import { signSelfCancelToken, selfServiceExpiry } from '../../core/domain/self-service-token';
import { participantCredentialId } from '../participant/code';
import { readCredential } from '../db/participant/credential';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export class SimulationParticipantLoginRepository implements SimulationParticipantLoginPort {
  private readonly source: string;
  constructor(
    private readonly db: DrizzlePgDb,
    sourceSchema: string,
    private readonly secret: string,
  ) {
    this.source = DatabaseSchema.parse(sourceSchema);
  }
  resolve(actor: PortalActor, code: string, now: Date) {
    return atomic(this.db, 'SimulationLogin', async (tx) => {
      const id = participantCredentialId(code);
      const allowed = id ? await authorizedStart(tx, this.source, actor.id, id) : null;
      if (!allowed) return failure(ERROR_CODES.UNAUTHORIZED, 'SimulationLogin', 'member');
      const row = await readCredential(tx, code, this.secret, true, now);
      if (!row) return failure(ERROR_CODES.UNAUTHORIZED, 'SimulationLogin', 'code');
      const token = await signSelfCancelToken(
        {
          organizationId: row.organizationId,
          bookingId: row.bookingId,
          version: row.version,
          expUnixSeconds: selfServiceExpiry(now, allowed.startsAt),
        },
        this.secret,
      );
      return token.ok ? ok({ organizationId: row.organizationId, token: token.value }) : token;
    });
  }
}
async function authorizedStart(
  tx: Executor,
  source: string,
  actorId: string,
  credentialId: string,
) {
  const [row] = await rows<{ startsAt: string | Date }>(
    tx,
    sql`
    SELECT s.starts_at AS "startsAt" FROM booking_access_credentials c
    JOIN ${sql.identifier(source)}.organization_members m ON m.organization_id=c.organization_id AND m.user_id=${actorId}
    JOIN ${sql.identifier(source)}.organization_access a ON a.organization_id=c.organization_id
    JOIN bookings b ON b.id=c.booking_id AND b.organization_id=c.organization_id
    JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
    WHERE c.id=${credentialId}
      AND NOT EXISTS(SELECT 1 FROM simulation_attempts t WHERE t.booking_id=b.id AND t.deleted_at IS NOT NULL)
    FOR SHARE OF m`,
  );
  return row ? { startsAt: new Date(row.startsAt) } : null;
}
