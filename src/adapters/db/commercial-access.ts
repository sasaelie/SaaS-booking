import { and, eq, isNull, inArray } from 'drizzle-orm';
import { activities, organizations } from './schema';
import { organizationAccess } from './schema/saas';
import type { Executor } from './transaction';
import { required } from './transaction';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
import { COMMERCIAL } from '../../config/commercial';
import { canUsePro, effectivePlan } from '../../core/domain/commercial';
import { publicSchedule } from '../../core/domain/public-booking-page';
import { readActivitySchedule } from './activity-schedule';
type Access = typeof organizationAccess.$inferSelect;
export async function commercialState(db: Executor, id: string, now = new Date(), persist = false) {
  const [access] = await db
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, id));
  if (!access) return required(failure(ERROR_CODES.NOT_FOUND, 'Commercial', 'organization'));
  const pro = canUsePro(access, now);
  const boundary =
    access.graceUntil && (!access.currentPeriodEnd || access.graceUntil > access.currentPeriodEnd)
      ? access.graceUntil
      : access.currentPeriodEnd;
  const stale =
    !access.libertySelectionAt ||
    Boolean(
      !access.libertySelectionManual &&
      boundary &&
      access.libertySelectionAt < boundary &&
      boundary <= now,
    );
  const selected =
    !pro && stale
      ? await defaultSelection(db, id, access, now, persist)
      : access.libertyActivityIds;
  return { access, pro, plan: effectivePlan(access, now), selected };
}
async function defaultSelection(
  db: Executor,
  id: string,
  access: Access,
  now: Date,
  persist: boolean,
) {
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!organization) return [];
  const list = await db
    .select()
    .from(activities)
    .where(and(eq(activities.organizationId, id), eq(activities.isActive, true)));
  const ranked = [];
  for (const activity of list) {
    ranked.push({ id: activity.id, next: await nextSession(db, id, activity, organization, now) });
  }
  const selected = ranked
    .filter((entry) => Number.isFinite(entry.next))
    .sort((a, b) => a.next - b.next || a.id.localeCompare(b.id))
    .slice(0, COMMERCIAL.LIBERTE_ACTIVITY_LIMIT)
    .map((a) => a.id);
  if (!persist) return selected;
  return persistSelection(db, id, access, selected, now);
}
export async function requirePro(db: Executor, id: string, now = new Date()) {
  const state = await commercialState(db, id, now);
  if (!state.pro) required(failure(ERROR_CODES.SUBSCRIPTION_REQUIRED, 'Commercial', 'pro'));
  return state;
}
export async function requirePublication(db: Executor, id: string, activityId: string) {
  const state = await commercialState(db, id);
  if (state.pro || state.selected.includes(activityId)) return;
  const opened = await openSelectedActivities(db, id, state.selected);
  if (opened.length >= COMMERCIAL.LIBERTE_ACTIVITY_LIMIT)
    required(failure(ERROR_CODES.SUBSCRIPTION_REQUIRED, 'Commercial', 'activity-limit'));
  if (!activityId) return;
  await db
    .update(organizationAccess)
    .set({
      libertyActivityIds: [...opened, activityId].slice(-COMMERCIAL.LIBERTE_ACTIVITY_LIMIT),
      libertySelectionAt: new Date(),
    })
    .where(eq(organizationAccess.organizationId, id));
}

async function nextSession(
  db: Executor,
  id: string,
  activity: typeof activities.$inferSelect,
  organization: typeof organizations.$inferSelect,
  now: Date,
) {
  const schedule = await readActivitySchedule(db, id, activity.id);
  const projected = publicSchedule(
    {
      ...activity,
      ...schedule,
      timezone: organization.timezone,
      organizationName: organization.name,
      bankIban: organization.bankIban,
      bankAccountName: organization.bankAccountName,
      merchantAccountId: organization.merchantAccountId,
      primaryTextColor: organization.primaryTextColor,
      brandTheme: 'SAGE',
      hasLogo: false,
      hasBackground: false,
      commercialAccessAllowed: true,
    },
    now,
  );
  return projected.ok
    ? (projected.value.find((slot) => slot.startsAt > now)?.startsAt.getTime() ?? Infinity)
    : Infinity;
}

export async function initializeCommercialSelection(db: Executor, id: string, now = new Date()) {
  await db
    .select({ id: organizationAccess.organizationId })
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, id))
    .for('update');
  return commercialState(db, id, now, true);
}

async function openSelectedActivities(db: Executor, id: string, selected: readonly string[]) {
  if (!selected.length) return [];
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!organization) return [];
  const list = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.organizationId, id),
        eq(activities.isActive, true),
        inArray(activities.id, [...selected]),
      ),
    );
  const result: string[] = [];
  for (const activity of list)
    if (Number.isFinite(await nextSession(db, id, activity, organization, new Date())))
      result.push(activity.id);
  return result;
}

async function persistSelection(
  db: Executor,
  id: string,
  access: Access,
  selected: string[],
  now: Date,
) {
  const updated = await db
    .update(organizationAccess)
    .set({ libertyActivityIds: selected, libertySelectionAt: now })
    .where(
      and(
        eq(organizationAccess.organizationId, id),
        access.libertySelectionAt
          ? eq(organizationAccess.libertySelectionAt, access.libertySelectionAt)
          : isNull(organizationAccess.libertySelectionAt),
      ),
    )
    .returning({ ids: organizationAccess.libertyActivityIds });
  if (updated[0]) return updated[0].ids;
  const [latest] = await db
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, id));
  return latest?.libertyActivityIds ?? selected;
}
