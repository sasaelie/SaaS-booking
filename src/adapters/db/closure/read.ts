import { isSeatCurrentlyOccupied } from '../../../core/domain/seat-calculator';
import { and, eq } from 'drizzle-orm';
import { sessions, bookings } from '../schema';
import type { Transaction } from '../transaction';
import { lockActivity } from '../activity-reader';

export async function closureContext(tx: Transaction, organizationId: string, sessionId: string) {
  const [initial] = await tx
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.organizationId, organizationId)));
  if (!initial) return null;
  await lockActivity(tx, organizationId, initial.activityId);
  const [session] = await tx
    .select()
    .from(sessions)
    .where(eq(sessions.id, initial.id))
    .for('update');
  if (!session) return null;
  const all = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.sessionId, session.id), eq(bookings.organizationId, organizationId)));
  const affected = all.filter((row) => isSeatCurrentlyOccupied(row, new Date()));
  return { session, affected };
}
