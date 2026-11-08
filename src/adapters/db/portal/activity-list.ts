import { asc, eq } from 'drizzle-orm';
import { activities, timeSlots } from '../schema';
import type { Executor } from '../transaction';
export async function portalActivities(db: Executor, organizationId: string) {
  const list = await db
    .select()
    .from(activities)
    .where(eq(activities.organizationId, organizationId))
    .orderBy(asc(activities.createdAt));
  const slots = await db
    .select()
    .from(timeSlots)
    .where(eq(timeSlots.organizationId, organizationId))
    .orderBy(timeSlots.dayOfWeek, timeSlots.startTimeLocal);
  return list.map((activity) => ({
    ...activity,
    weeklySlots: slots.filter((slot) => slot.activityId === activity.id),
  }));
}
