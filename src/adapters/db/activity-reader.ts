import { effectivePaymentMode } from '../../core/domain/commercial';
import { hasPaymentConfiguration } from '../../core/domain/payment-configuration';
import { organizationBranding } from './schema/saas';
import { commercialState } from './commercial-access';
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
    .select({
      activity: activities,
      organization: organizations,
      branding: organizationBranding,
    })
    .from(activities)
    .innerJoin(organizations, eq(activities.organizationId, organizations.id))
    .leftJoin(organizationBranding, eq(organizationBranding.organizationId, organizations.id))
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, organizationId)));
  if (!row) return failure(ERROR_CODES.NOT_FOUND, 'Activity', 'readActivity');
  const state = await commercialState(db, organizationId);
  const paymentMode = effectivePaymentMode(
    row.activity.paymentMode,
    row.activity.priceCents,
    state.pro,
  );
  const schedule = await readActivitySchedule(db, organizationId, activityId);
  return ok({
    ...row.activity,
    paymentMode,
    commercialPlan: state.plan,
    showPlatformSignature: !state.pro,
    ...activityBrand(row),
    paymentReady:
      hasPaymentConfiguration(paymentMode, row.organization) &&
      (state.pro || row.activity.priceCents === 0 || Boolean(row.organization.merchantAccountId)),
    commercialAccessAllowed:
      !state.access.suspendedAt && (state.pro || state.selected.includes(activityId)),
    ...schedule,
    ...organizationIdentity(row.organization),
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

function organizationIdentity(org: typeof organizations.$inferSelect) {
  return {
    organizationName: org.name,
    timezone: org.timezone,
    primaryTextColor: org.primaryTextColor,
    merchantAccountId: org.merchantAccountId,
    bankIban: org.bankIban,
    bankAccountName: org.bankAccountName,
  };
}

function activityBrand(row: {
  organization: typeof organizations.$inferSelect;
  branding: typeof organizationBranding.$inferSelect | null;
}) {
  return {
    socialLinks: row.organization.socialLinks,
    participantHue: row.branding?.participantHue ?? null,
    storyTextTone: row.branding?.storyTextTone ?? 'WHITE',
    brandTheme: row.branding?.theme ?? 'SAGE',
    hasLogo: Boolean(row.branding?.logoStorageKey),
    hasBackground: Boolean(row.branding?.backgroundStorageKey),
  };
}
