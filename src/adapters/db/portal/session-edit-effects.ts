import { and, eq } from 'drizzle-orm';
import { sessions, bookings } from '../schema';
import { platformAudit } from '../schema/saas';
import type { Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { SessionEditCommand } from '../../../core/ports/session-edit.port';
import { enqueue } from '../jobs/enqueue';
import { JOB_TYPES } from '../../../config/constants';
export async function persistSessionEdit(
  tx: Transaction,
  actor: PortalActor,
  input: SessionEditCommand,
  session: typeof sessions.$inferSelect,
  affected: readonly (typeof bookings.$inferSelect)[],
  hash: string,
) {
  const moved = input.newStartsAt.getTime() !== session.startsAt.getTime();
  await tx
    .update(sessions)
    .set({
      startsAt: input.newStartsAt,
      endsAt: input.newEndsAt,
      capacity: input.newCapacity,
      isManual: session.isManual || moved,
    })
    .where(and(eq(sessions.id, session.id), eq(sessions.organizationId, input.organizationId)));
  // A cancelled occurrence blocks the weekly generator from recreating the old slot.
  if (moved && !session.isManual)
    await tx.insert(sessions).values({
      organizationId: input.organizationId,
      activityId: input.activityId,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      capacity: session.capacity,
      isManual: false,
      isCancelled: true,
    });
  for (const booking of affected.filter((row) => row.status === 'CONFIRMED'))
    await enqueue(
      tx,
      input.organizationId,
      JOB_TYPES.EVENT_UPDATE,
      `session-update:${booking.id}:${hash}`,
      { bookingId: booking.id },
    );
  await auditSessionEdit(tx, actor, input, session);
}

async function auditSessionEdit(
  tx: Transaction,
  actor: PortalActor,
  input: SessionEditCommand,
  session: typeof sessions.$inferSelect,
) {
  await tx.insert(platformAudit).values({
    organizationId: input.organizationId,
    actorUserId: actor.id,
    action: `SESSION_UPDATED:${session.id}:${session.startsAt.toISOString()}:${input.newStartsAt.toISOString()}:${session.capacity}:${input.newCapacity}`,
  });
}
