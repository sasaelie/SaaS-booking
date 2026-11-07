import { sql, and, eq } from 'drizzle-orm';
import { bookings, sessions } from '../schema';
import { rows } from '../transaction';
import type { Transaction } from '../transaction';
import type { AtomicSeatReservationInput } from '../../../core/ports/session-repository.port';
export type BookingRow = typeof bookings.$inferSelect;
export async function reservationClock(
  tx: Transaction,
  input: AtomicSeatReservationInput,
): Promise<Date> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.input.organizationId}:${input.input.idempotencyKey}`},0))`,
  );
  const [clock] = await rows<{ now: string }>(tx, sql`SELECT clock_timestamp() AS now`);
  if (!clock) throw Error('Clock unavailable');
  return new Date(new Date(clock.now));
}
export async function existingBooking(
  tx: Transaction,
  input: AtomicSeatReservationInput,
): Promise<BookingRow | undefined> {
  const [row] = await tx
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.organizationId, input.input.organizationId),
        eq(bookings.idempotencyKey, input.input.idempotencyKey),
      ),
    );
  return row;
}
export async function lockSession(
  tx: Transaction,
  organizationId: string,
  activityId: string,
  startsAt: Date,
  endsAt: Date,
  capacity: number,
): Promise<typeof sessions.$inferSelect> {
  await tx
    .insert(sessions)
    .values({ organizationId, activityId, startsAt, endsAt, capacity })
    .onConflictDoNothing({ target: [sessions.activityId, sessions.startsAt] });
  const [session] = await tx
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.organizationId, organizationId),
        eq(sessions.activityId, activityId),
        eq(sessions.startsAt, startsAt),
      ),
    )
    .for('update');
  if (!session) throw Error('Session missing');
  return session;
}
