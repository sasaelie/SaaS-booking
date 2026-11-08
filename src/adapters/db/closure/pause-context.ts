import { isSeatCurrentlyOccupied } from '../../../core/domain/seat-calculator';
import { and, eq, lt, gt, inArray } from 'drizzle-orm';
import { sessions, bookings } from '../schema';
import type { Transaction } from '../transaction';
import { lockActivity } from '../activity-reader';
import type { AddPauseInput } from '../../../core/ports/pause.port';
import { BOOKING_STATUSES } from '../../../config/constants';
export async function pauseContext(tx: Transaction, input: AddPauseInput) {
  await lockActivity(tx, input.organizationId, input.activityId);
  const affectedSessions = await tx
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.organizationId, input.organizationId),
        eq(sessions.activityId, input.activityId),
        eq(sessions.isManual, false),
        eq(sessions.isCancelled, false),
        lt(sessions.startsAt, input.endsAt),
        gt(sessions.endsAt, input.startsAt),
      ),
    )
    .for('update');
  const ids = affectedSessions.map((row) => row.id);
  const affected = ids.length
    ? await tx
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.organizationId, input.organizationId),
            inArray(bookings.sessionId, ids),
            inArray(bookings.status, [
              BOOKING_STATUSES.CONFIRMED,
              BOOKING_STATUSES.PENDING_PAYMENT,
              BOOKING_STATUSES.PROOF_SUBMITTED,
            ]),
          ),
        )
    : [];
  return { ids, affected: affected.filter((row) => isSeatCurrentlyOccupied(row, new Date())) };
}
