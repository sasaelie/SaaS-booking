import { eq, sql } from 'drizzle-orm';
import { sessions } from './schema';
import { atomic, rows, required, type Transaction } from './transaction';
import type { DrizzlePgDb } from './client';
import { closureContext } from './closure/read';
import { cancelByOrganizer } from './closure/cancel-booking';
import type {
  SessionClosureRepositoryPort,
  CloseSessionInput,
  CloseSessionOutcome,
} from '../../core/ports/closure.port';
import { sha256 } from '../../lib/sha256';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
async function close(
  tx: Transaction,
  input: CloseSessionInput,
): Promise<Result<CloseSessionOutcome>> {
  const context = await closureContext(tx, input.organizationId, input.sessionId);
  if (!context) return failure(ERROR_CODES.NOT_FOUND, 'Closure', 'close');
  const { session, affected } = context;
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
  const [clock] = await rows<{ now: string }>(tx, sql`SELECT clock_timestamp() AS now`);
  if (!clock) throw Error('Clock unavailable');
  await tx.update(sessions).set({ isCancelled: true }).where(eq(sessions.id, session.id));
  for (const booking of affected)
    await cancelByOrganizer(tx, booking, input.reason, new Date(clock.now));
  return ok({
    status: 'CLOSED_AND_REFUNDS_QUEUED',
    cancelledBookingsCount: affected.length,
    notificationBookingIds: affected.map((booking) => booking.id),
  });
}
export class DrizzleClosureRepository implements SessionClosureRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  closeSessionAtomically(input: CloseSessionInput): Promise<Result<CloseSessionOutcome>> {
    return atomic(this.db, 'Closure', (tx) => close(tx, input));
  }
}
