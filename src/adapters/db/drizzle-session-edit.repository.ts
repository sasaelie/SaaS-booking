import { and, eq } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic, required, type Transaction } from './transaction';
import { bookings, sessions } from './schema';
import { lockActivity, readActivity } from './activity-reader';
import { requireMembership } from './portal/authorization';
import { describePortalSession } from '../../core/domain/portal-session';
import { isSeatCurrentlyOccupied } from '../../core/domain/seat-calculator';
import { lockSession } from './reservation/context';
import type { PortalActor } from '../../core/ports/portal-models';
import type {
  SessionEditPort,
  SessionEditCommand,
  SessionEditOutcome,
} from '../../core/ports/session-edit.port';
import { sha256 } from '../../lib/sha256';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
import { persistSessionEdit } from './portal/session-edit-effects';
export class DrizzleSessionEditRepository implements SessionEditPort {
  constructor(private readonly db: DrizzlePgDb) {}
  update(actor: PortalActor, input: SessionEditCommand) {
    return atomic(this.db, 'SessionEdit', (tx) => update(tx, actor, input));
  }
}
async function editableSession(
  tx: Transaction,
  actor: PortalActor,
  input: SessionEditCommand,
  now: Date,
) {
  await requireMembership(tx, actor, input.organizationId);
  await lockActivity(tx, input.organizationId, input.activityId);
  const activity = required(await readActivity(tx, input.organizationId, input.activityId));
  const described = required(describePortalSession(activity, new Date(input.startsAt), now));
  if (
    described.isCancelled ||
    described.startsAt <= now ||
    input.newStartsAt <= now ||
    input.newEndsAt <= input.newStartsAt
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'SessionEdit', 'dates');
  const session = await lockSession(
    tx,
    input.organizationId,
    input.activityId,
    described.startsAt,
    described.endsAt,
    described.capacity,
  );
  if (
    session.endsAt.toISOString() !== new Date(input.endsAt).toISOString() ||
    session.capacity !== input.capacity
  )
    return failure(ERROR_CODES.CONFLICT, 'SessionEdit', 'stale');
  required(await validateTarget(tx, input, session.id));
  const list = await sessionBookings(tx, input.organizationId, session.id);
  const moving =
    input.newStartsAt.getTime() !== session.startsAt.getTime() ||
    input.newEndsAt.getTime() !== session.endsAt.getTime();
  required(validateReservations(list, input, moving, now));
  return ok({ session, list, moving });
}
function sessionBookings(tx: Transaction, organizationId: string, sessionId: string) {
  return tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.organizationId, organizationId), eq(bookings.sessionId, sessionId)));
}
async function update(
  tx: Transaction,
  actor: PortalActor,
  input: SessionEditCommand,
): Promise<Result<SessionEditOutcome>> {
  const context = await editableSession(tx, actor, input, new Date());
  if (!context.ok) return context;
  const { session, list, moving } = context.value;
  if (!moving && session.capacity === input.newCapacity)
    return ok({ status: 'SESSION_UPDATED', sessionStartsAt: session.startsAt.toISOString() });
  const affected = list.filter((row) =>
    ['CONFIRMED', 'PENDING_PAYMENT', 'PROOF_SUBMITTED'].includes(row.status),
  );
  const hash = required(
    await sha256(
      JSON.stringify([
        session.id,
        session.startsAt,
        session.endsAt,
        session.capacity,
        input.newStartsAt,
        input.newEndsAt,
        input.newCapacity,
        affected.map((row) => `${row.id}:${row.status}`).sort(),
      ]),
    ),
  );
  if (affected.length && (!input.confirmCancelExistingBookings || input.confirmationHash !== hash))
    return ok({
      status: 'CONFIRMATION_REQUIRED',
      confirmationHash: hash,
      affectedBookingsCount: affected.length,
    });
  await persistSessionEdit(tx, actor, input, session, affected, hash);
  return ok({ status: 'SESSION_UPDATED', sessionStartsAt: input.newStartsAt.toISOString() });
}

function validateReservations(
  list: readonly (typeof bookings.$inferSelect)[],
  input: SessionEditCommand,
  moving: boolean,
  now: Date,
) {
  if (input.newCapacity < list.filter((row) => isSeatCurrentlyOccupied(row, now)).length)
    return failure(ERROR_CODES.SESSION_FULL, 'SessionEdit', 'capacity');
  if (
    moving &&
    list.some(
      (row) =>
        row.status === 'PROOF_SUBMITTED' ||
        (row.status === 'PENDING_PAYMENT' && row.lockedUntil && row.lockedUntil > now),
    )
  )
    return failure(ERROR_CODES.CONFLICT, 'SessionEdit', 'pending-payments');
  return ok(undefined);
}

async function validateTarget(tx: Transaction, input: SessionEditCommand, sessionId: string) {
  const [target] = await tx
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.organizationId, input.organizationId),
        eq(sessions.activityId, input.activityId),
        eq(sessions.startsAt, input.newStartsAt),
      ),
    );
  return target && target.id !== sessionId
    ? failure(ERROR_CODES.CONFLICT, 'SessionEdit', 'occupied-target')
    : ok(undefined);
}
