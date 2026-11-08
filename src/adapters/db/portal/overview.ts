import { eq, sql } from 'drizzle-orm';
import { bookings } from '../schema';
import type { Executor } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import { getOrganization } from './organizations';
import { portalActivities } from './activity-list';
import { workspaceSchedule } from './schedule';
import { BOOKING_STATUSES } from '../../../config/constants';
import { ok } from '../../../lib/result';
export async function portalOverview(db: Executor, actor: PortalActor, id: string) {
  const organization = await getOrganization(db, actor, id);
  if (!organization.ok) return organization;
  const activities = await portalActivities(db, id);
  const [counts] = await db
    .select({
      bookingCount: sql<number>`count(*)::int`,
      pendingProofCount: sql<number>`count(*) FILTER(WHERE ${bookings.status}=${BOOKING_STATUSES.PROOF_SUBMITTED})::int`,
      pendingRefundCount: sql<number>`count(*) FILTER(WHERE ${bookings.refundStatus} IN ('MANUAL_PENDING','PENDING'))::int`,
    })
    .from(bookings)
    .where(eq(bookings.organizationId, id));
  const schedule = await workspaceSchedule(db, id, activities);
  if (!schedule.ok) return schedule;
  return ok({
    organization: organization.value,
    activities,
    sessions: schedule.value,
    bookingCount: counts?.bookingCount ?? 0,
    pendingProofCount: counts?.pendingProofCount ?? 0,
    pendingRefundCount: counts?.pendingRefundCount ?? 0,
  });
}
