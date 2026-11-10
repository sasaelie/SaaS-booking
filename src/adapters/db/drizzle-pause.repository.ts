import { inArray } from 'drizzle-orm';
import { sessions, pausePeriods } from './schema';
import { atomic, required } from './transaction';
import type { DrizzlePgDb } from './client';
import { pauseContext } from './closure/pause-context';
import { cancelByOrganizer } from './closure/cancel-booking';
import { sha256 } from '../../lib/sha256';
import { ok, type Result } from '../../lib/result';
import type { CloseSessionOutcome } from '../../core/ports/closure.port';
import type { PauseRepositoryPort, AddPauseInput } from '../../core/ports/pause.port';
export class DrizzlePauseRepository implements PauseRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  addPauseAtomically(input: AddPauseInput): Promise<Result<CloseSessionOutcome>> {
    return atomic<CloseSessionOutcome>(this.db, 'Pause', async (tx) => {
      const { ids, affected } = await pauseContext(tx, input);
      const confirmationHash = required(
        await sha256(JSON.stringify(affected.map((row) => `${row.id}:${row.status}`).sort())),
      );
      if (
        affected.length &&
        (!input.confirmCancelExistingBookings || input.confirmationHash !== confirmationHash)
      )
        return ok({
          status: 'CONFIRMATION_REQUIRED',
          affectedBookingsCount: affected.length,
          confirmationHash,
        });
      await tx.insert(pausePeriods).values({
        organizationId: input.organizationId,
        activityId: input.activityId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        reason: input.reason,
      });
      if (ids.length)
        await tx.update(sessions).set({ isCancelled: true }).where(inArray(sessions.id, ids));
      for (const booking of affected)
        await cancelByOrganizer(tx, booking, input.reason, new Date());
      return ok({
        status: 'CLOSED_AND_REFUNDS_QUEUED',
        cancelledBookingsCount: affected.length,
        notificationBookingIds: affected.map((booking) => booking.id),
      });
    });
  }
}
