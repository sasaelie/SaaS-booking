import { paymentConfiguration } from './payment-configuration';
import { and, eq, sql } from 'drizzle-orm';
import { activities, timeSlots, sessions } from '../schema';
import { rows, type Transaction } from '../transaction';
import { requireMembership } from './authorization';
import { requireCommercialAccess } from './access';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { CreateActivityInput } from '../../../core/ports/portal-inputs';
import { ERROR_CODES } from '../../../config/constants';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { requirePublication, requirePro } from '../commercial-access';
export async function createActivity(
  tx: Transaction,
  actor: PortalActor,
  input: CreateActivityInput,
) {
  await requireMembership(tx, actor, input.organizationId);
  await requireCommercialAccess(tx, input.organizationId, new Date());
  const payment = await activityPayment(tx, input);
  if (!payment.ok) return payment;
  if (input.allowExternalBenefitExchange) await requirePro(tx, input.organizationId);
  const { schedule, ...values } = input;
  await requirePublication(tx, input.organizationId, '');
  if (schedule.kind === 'MANUAL' && schedule.startsAt.getTime() <= Date.now())
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Activity', 'past');
  const [activity] = await tx.insert(activities).values(values).returning({ id: activities.id });
  if (!activity) return failure(ERROR_CODES.INTERNAL_ERROR, 'Activity', 'insert');
  await requirePublication(tx, input.organizationId, activity.id);
  if (schedule.kind === 'WEEKLY')
    await tx.insert(timeSlots).values(
      schedule.slots.map((slot) => ({
        ...slot,
        organizationId: input.organizationId,
        activityId: activity.id,
      })),
    );
  else
    await tx.insert(sessions).values({
      organizationId: input.organizationId,
      activityId: activity.id,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      capacity: schedule.capacity,
      isManual: true,
    });
  return ok({ activityId: activity.id });
}
export async function archiveActivity(
  tx: Transaction,
  actor: PortalActor,
  organizationId: string,
  activityId: string,
) {
  await requireMembership(tx, actor, organizationId);
  await rows(
    tx,
    sql`SELECT id FROM activities WHERE id=${activityId} AND organization_id=${organizationId} FOR UPDATE`,
  );
  const updated = await tx
    .update(activities)
    .set({ isActive: false })
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, organizationId)))
    .returning({ id: activities.id });
  return updated.length ? ok(undefined) : failure(ERROR_CODES.NOT_FOUND, 'Activity', 'archive');
}

function activityPayment(tx: Transaction, input: CreateActivityInput) {
  return paymentConfiguration(tx, input.organizationId, input.paymentMode, input.priceCents);
}
