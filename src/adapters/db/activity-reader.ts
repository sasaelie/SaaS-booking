import { and, eq, sql } from 'drizzle-orm';
import { activities, organizations } from './schema';
import type { Executor } from './transaction';
import { rows } from './transaction';
import { readActivitySchedule } from './activity-schedule';
import { ok, type Result } from '../../lib/result';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
import type { ActivityWithScheduleConfig } from '../../core/ports/booking-ports';
export async function readActivity(
  db: Executor,
  organizationId: string,
  activityId: string,
): Promise<Result<ActivityWithScheduleConfig>> {
  const [row] = await db
    .select()
    .from(activities)
    .innerJoin(organizations, eq(activities.organizationId, organizations.id))
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, organizationId)));
  if (!row) return failure(ERROR_CODES.NOT_FOUND, 'Activity', 'readActivity');
  const schedule = await readActivitySchedule(db, organizationId, activityId);
  return ok({
    ...row.activities,
    ...schedule,
    organizationName: row.organizations.name,
    timezone: row.organizations.timezone,
    primaryTextColor: row.organizations.primaryTextColor,
    merchantAccountId: row.organizations.merchantAccountId,
    bankIban: row.organizations.bankIban,
    bankAccountName: row.organizations.bankAccountName,
  });
}
export async function lockActivity(
  db: Executor,
  organizationId: string,
  activityId: string,
): Promise<void> {
  await rows(
    db,
    sql`SELECT id FROM activities WHERE id=${activityId} AND organization_id=${organizationId} FOR UPDATE`,
  );
}
