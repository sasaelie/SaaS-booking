import { and, eq, gt } from 'drizzle-orm';
import { bookings, sessions } from '../schema';
import type { Transaction } from '../transaction';
import { enqueue } from './enqueue';
import { JOB_TYPES } from '../../../config/constants';
import { sha256 } from '../../../lib/sha256';
import { required } from '../transaction';
export async function enqueueEventUpdates(
  tx: Transaction,
  organizationId: string,
  activityId: string,
  content: string,
) {
  const hash = required(await sha256(content));
  const list = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(sessions, eq(sessions.id, bookings.sessionId))
    .where(
      and(
        eq(bookings.organizationId, organizationId),
        eq(bookings.activityId, activityId),
        eq(bookings.status, 'CONFIRMED'),
        gt(sessions.startsAt, new Date()),
      ),
    );
  for (const booking of list)
    await enqueue(
      tx,
      organizationId,
      JOB_TYPES.EVENT_UPDATE,
      `event-update:${booking.id}:${hash}`,
      { bookingId: booking.id },
    );
}
