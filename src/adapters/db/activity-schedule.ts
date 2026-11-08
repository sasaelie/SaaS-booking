import { timeSlots, pausePeriods, sessions, bookings } from './schema';
import type { Executor } from './transaction';
import { tenantActivity } from './tenant-filter';
export async function readActivitySchedule(
  db: Executor,
  organizationId: string,
  activityId: string,
) {
  const weeklySlots = await db
    .select()
    .from(timeSlots)
    .where(tenantActivity(timeSlots, organizationId, activityId));
  const pauses = await db
    .select()
    .from(pausePeriods)
    .where(tenantActivity(pausePeriods, organizationId, activityId));
  const persisted = await db
    .select()
    .from(sessions)
    .where(tenantActivity(sessions, organizationId, activityId));
  const snapshots = await db
    .select()
    .from(bookings)
    .where(tenantActivity(bookings, organizationId, activityId));
  const bookingsBySessionId: Record<string, typeof snapshots> = {};
  for (const booking of snapshots) (bookingsBySessionId[booking.sessionId] ??= []).push(booking);
  return { weeklySlots, pausePeriods: pauses, manualSessions: persisted, bookingsBySessionId };
}
