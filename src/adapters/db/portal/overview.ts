import { canUsePro, effectivePaymentMode } from '../../../core/domain/commercial';
import { dashboardCounts } from './dashboard-counts';
import type { Executor } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import { getOrganization } from './organizations';
import { portalActivities } from './activity-list';
import { workspaceSchedule } from './schedule';
import { ok } from '../../../lib/result';
export async function portalOverview(db: Executor, actor: PortalActor, id: string) {
  const organization = await getOrganization(db, actor, id);
  if (!organization.ok) return organization;
  const activities = await portalActivities(db, id);
  const counts = await dashboardCounts(db, id);
  const schedule = await workspaceSchedule(db, id, activities);
  if (!schedule.ok) return schedule;
  return ok({
    organization: organization.value,
    activities: activities.map((activity) => ({
      ...activity,
      reservationsOpen:
        !organization.value.access.suspendedAt &&
        (canUsePro(organization.value.access, new Date()) ||
          Boolean(organization.value.access.libertyActivityIds?.includes(activity.id))),
      paymentMode: effectivePaymentMode(
        activity.paymentMode,
        activity.priceCents,
        canUsePro(organization.value.access, new Date()),
      ),
    })),
    sessions: schedule.value,
    ...counts,
  });
}
