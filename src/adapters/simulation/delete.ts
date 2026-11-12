import { SIMULATION } from '../../config/simulation';
import { eq, and, sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../db/client';
import { bookings, rescheduleVouchers } from '../db/schema';
import { atomic } from '../db/transaction';
import { ERROR_CODES, BOOKING_STATUSES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export function deleteSimulation(db: DrizzlePgDb, org: string, id: string) {
  return atomic(db, 'Simulation', async (tx) => {
    const [b] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.organizationId, org)))
      .for('update');
    if (!b) return failure(ERROR_CODES.NOT_FOUND, 'Simulation', 'delete');
    await tx
      .update(rescheduleVouchers)
      .set({ status: 'EXPIRED', lockedBookingId: null, lockedUntil: null })
      .where(and(eq(rescheduleVouchers.organizationId, org), eq(rescheduleVouchers.lockedBookingId, id)));
    await tx
      .update(rescheduleVouchers)
      .set({ status: 'EXPIRED', lockedBookingId: null, lockedUntil: null })
      .where(and(eq(rescheduleVouchers.organizationId, org), eq(rescheduleVouchers.originBookingId, id)));
    await tx
      .update(bookings)
      .set({
        status: BOOKING_STATUSES.CANCELLED_BY_ATTENDEE,
        ...SIMULATION.DELETED_IDENTITY,
        anonymizedAt: new Date(),
        lockedUntil: null,
        selfServiceVersion: b.selfServiceVersion + 1,
      })
      .where(eq(bookings.id, id));
    await tx.execute(
      sql`INSERT INTO simulation_attempts(booking_id,organization_id,deleted_at) VALUES(${id},${org},now()) ON CONFLICT(booking_id) DO UPDATE SET deleted_at=now()`,
    );
    await tx.execute(sql`DELETE FROM outbox_jobs WHERE organization_id=${org} AND payload->>'bookingId'=${id}`);
    return ok(undefined);
  });
}
