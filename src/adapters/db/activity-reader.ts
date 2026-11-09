import { hasPaymentConfiguration } from '../../core/domain/payment-configuration';
import { organizationAccess, organizationBranding } from './schema/saas';
import { hasCommercialAccess } from '../../core/domain/subscription-access';
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
      access: organizationAccess,
      branding: organizationBranding,
    })
    .from(activities)
    .innerJoin(organizations, eq(activities.organizationId, organizations.id))
    .leftJoin(organizationAccess, eq(organizationAccess.organizationId, organizations.id))
    .leftJoin(organizationBranding, eq(organizationBranding.organizationId, organizations.id))
    .where(and(eq(activities.id, activityId), eq(activities.organizationId, organizationId)));
  if (!row) return failure(ERROR_CODES.NOT_FOUND, 'Activity', 'readActivity');
  const schedule = await readActivitySchedule(db, organizationId, activityId);
  return ok({
    ...row.activity,
    socialLinks: row.organization.socialLinks,
    participantHue: row.branding?.participantHue ?? null,
    storyTextTone: row.branding?.storyTextTone ?? 'WHITE',
    brandTheme: row.branding?.theme ?? 'SAGE',
    hasLogo: Boolean(row.branding?.logoStorageKey),
    hasBackground: Boolean(row.branding?.backgroundStorageKey),
    commercialAccessAllowed: Boolean(
      row.access &&
      hasCommercialAccess(row.access, new Date()) &&
      hasPaymentConfiguration(row.activity.paymentMode, row.organization),
    ),
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
