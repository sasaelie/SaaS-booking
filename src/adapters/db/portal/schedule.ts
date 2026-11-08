import type { Executor } from '../transaction';
import { readActivity } from '../activity-reader';
import { publicSchedule } from '../../../core/domain/public-booking-page';
import type { PortalActivity, PortalSession } from '../../../core/ports/portal-models';
import { ok, type Result } from '../../../lib/result';
import { SAAS } from '../../../config/constants';
export async function workspaceSchedule(
  db: Executor,
  organizationId: string,
  activities: readonly PortalActivity[],
): Promise<Result<readonly PortalSession[]>> {
  const results: PortalSession[] = [];
  const now = new Date();
  for (const activity of activities) {
    const current = await readActivity(db, organizationId, activity.id);
    if (!current.ok) return current;
    const schedule = publicSchedule(current.value, now);
    if (!schedule.ok) return schedule;
    for (const session of schedule.value)
      results.push({
        id: session.persistedSessionId,
        activityId: activity.id,
        activityName: activity.name,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        capacity: session.availability.capacity,
        isManual: session.isManual,
        isCancelled: false,
        availabilityLabel: session.availability.displayLabel,
      });
  }
  return ok(
    results
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, SAAS.SESSION_LIMIT),
  );
}
