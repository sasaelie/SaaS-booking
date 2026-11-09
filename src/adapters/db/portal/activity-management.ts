import { enqueueEventUpdates } from '../jobs/event-updates';
import { paymentConfiguration } from './payment-configuration';
import { and, eq, sql } from 'drizzle-orm';
import { activities, sessions, bookings } from '../schema';
import { platformAudit } from '../schema/saas';
import { rows, type Transaction } from '../transaction';
import { lockBookingContext } from '../payment/locks';
import { requireMembership } from './authorization';
import { requireCommercialAccess } from './access';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { UpdateActivityInput, AddManualSessionInput } from '../../../core/ports/portal-inputs';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES, PAYMENT_MODES } from '../../../config/constants';
async function lockManagedActivity(
  tx: Transaction,
  actor: PortalActor,
  id: string,
  activityId: string,
) {
  await requireMembership(tx, actor, id);
  const result = await rows(
    tx,
    sql`SELECT id FROM activities WHERE id=${activityId} AND organization_id=${id} FOR UPDATE`,
  );
  await requireCommercialAccess(tx, id, new Date());
  return result.length > 0;
}
export async function updateActivity(
  tx: Transaction,
  actor: PortalActor,
  input: UpdateActivityInput,
) {
  const { organizationId, activityId, ...values } = input;
  if (!(await lockManagedActivity(tx, actor, organizationId, activityId)))
    return failure(ERROR_CODES.NOT_FOUND, 'Activity', 'update');
  const payment = await paymentConfiguration(tx, organizationId, input.paymentMode);
  if (!payment.ok) return payment;
  const [previous] = await tx
    .select()
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, organizationId)));
  await tx
    .update(activities)
    .set(values)
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, organizationId)));
  if (
    previous &&
    (previous.address !== input.address ||
      previous.addressVisibility !== input.addressVisibility ||
      previous.practicalInfo !== input.practicalInfo)
  )
    await enqueueEventUpdates(
      tx,
      organizationId,
      activityId,
      JSON.stringify([input.address, input.addressVisibility, input.practicalInfo]),
    );
  return ok({ activityId });
}
export async function publishActivity(
  tx: Transaction,
  actor: PortalActor,
  id: string,
  activityId: string,
) {
  if (!(await lockManagedActivity(tx, actor, id, activityId)))
    return failure(ERROR_CODES.NOT_FOUND, 'Activity', 'publish');
  await tx
    .update(activities)
    .set({ isActive: true })
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, id)));
  return ok(undefined);
}
export async function addSession(
  tx: Transaction,
  actor: PortalActor,
  input: AddManualSessionInput,
) {
  if (!(await lockManagedActivity(tx, actor, input.organizationId, input.activityId)))
    return failure(ERROR_CODES.NOT_FOUND, 'Session', 'create');
  if (input.startsAt.getTime() <= Date.now() || input.endsAt <= input.startsAt)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Session', 'dates');
  const inserted = await tx
    .insert(sessions)
    .values({ ...input, isManual: true })
    .onConflictDoNothing()
    .returning({ id: sessions.id });
  return inserted.length ? ok(undefined) : failure(ERROR_CODES.CONFLICT, 'Session', 'duplicate');
}
export async function recordBankRefund(
  tx: Transaction,
  actor: PortalActor,
  id: string,
  bookingId: string,
  reference: string,
) {
  await requireMembership(tx, actor, id);
  const context = await lockBookingContext(tx, id, bookingId);
  const booking = context?.booking;
  if (!booking || booking.paymentMode !== PAYMENT_MODES.BANK_TRANSFER)
    return failure(ERROR_CODES.NOT_FOUND, 'Refund', 'booking');
  if (booking.refundStatus === 'MANUAL_DONE') return ok(undefined);
  if (booking.refundStatus !== 'MANUAL_PENDING')
    return failure(ERROR_CODES.CONFLICT, 'Refund', 'state');
  await tx
    .update(bookings)
    .set({ refundStatus: 'MANUAL_DONE', refundId: reference })
    .where(and(eq(bookings.id, bookingId), eq(bookings.organizationId, id)));
  await tx
    .insert(platformAudit)
    .values({ organizationId: id, actorUserId: actor.id, action: 'MANUAL_REFUND_RECORDED' });
  return ok(undefined);
}
