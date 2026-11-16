import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../client';
import { atomic } from '../transaction';
import { requireMembership } from '../portal/authorization';
import { bookingParticipantCode } from '../../participant/booking-code';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { ParticipantRecoveryPort } from '../../../core/ports/participant-recovery.port';
import { ERROR_CODES } from '../../../config/constants';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
export class ParticipantRecoveryRepository implements ParticipantRecoveryPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly secret: string,
  ) {}
  recover(actor: PortalActor, organizationId: string, bookingId: string) {
    return atomic(this.db, 'ParticipantRecovery', async (tx) => {
      await requireMembership(tx, actor, organizationId);
      const code = await bookingParticipantCode(tx, organizationId, bookingId, this.secret);
      if (!code) return failure(ERROR_CODES.NOT_FOUND, 'ParticipantRecovery', 'booking');
      await tx.execute(sql`INSERT INTO booking_access_events(organization_id,booking_id,action)
        VALUES(${organizationId},${bookingId},'ORGANIZER_RECOVERY')`);
      return ok(code);
    });
  }
}
