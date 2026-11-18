import { sql } from 'drizzle-orm';
import { rows, type Transaction } from '../transaction';
import type { PlatformReportInput } from '../../../core/validation/platform-reporting';
import type { PlatformUsageReport } from '../../../core/ports/platform-reporting';
export async function platformUsage(
  tx: Transaction,
  filter: PlatformReportInput,
): Promise<PlatformUsageReport> {
  const [metrics] = await rows<UsageMetrics>(
    tx,
    sql`SELECT
    (SELECT count(DISTINCT user_id)::int FROM organization_members WHERE created_at>=${filter.start} AND created_at<${filter.end}) AS "organizerCount",
    (SELECT count(*)::int FROM organizations WHERE created_at>=${filter.start} AND created_at<${filter.end}) AS "organizationCount",
    count(DISTINCT organization_id) FILTER(WHERE status='CONFIRMED' AND confirmed_at>=${filter.start} AND confirmed_at<${filter.end})::int AS "activeOrganizationCount",
    count(*) FILTER(WHERE status='CONFIRMED' AND confirmed_at>=${filter.start} AND confirmed_at<${filter.end})::int AS "confirmedCount",
    count(*) FILTER(WHERE status LIKE 'CANCELLED%' AND cancelled_at>=${filter.start} AND cancelled_at<${filter.end})::int AS "cancelledCount",
    count(DISTINCT lower(email)) FILTER(WHERE status='CONFIRMED' AND confirmed_at>=${filter.start} AND confirmed_at<${filter.end})::int AS "participantCount",
    (SELECT count(*)::int FROM activities WHERE created_at>=${filter.start} AND created_at<${filter.end}) AS "activityCount",
    (SELECT count(*)::int FROM activities WHERE is_active AND created_at>=${filter.start} AND created_at<${filter.end}) AS "publishedCount"
    FROM bookings WHERE (confirmed_at>=${filter.start} AND confirmed_at<${filter.end}) OR (cancelled_at>=${filter.start} AND cancelled_at<${filter.end})`,
  );
  const daily = await rows<{ day: string; count: number }>(
    tx,
    sql`SELECT to_char(d.day,'YYYY-MM-DD') AS day,COALESCE(b.count,0)::int AS count
    FROM generate_series(${filter.from}::date,${filter.to}::date,'1 day') d(day)
    LEFT JOIN (SELECT (confirmed_at AT TIME ZONE 'Europe/Brussels')::date AS day,count(*)::int AS count FROM bookings WHERE status='CONFIRMED' AND confirmed_at>=${filter.start} AND confirmed_at<${filter.end} GROUP BY 1) b ON b.day=d.day ORDER BY d.day`,
  );
  const cohort = await usageCohort(tx, filter);
  const kinds = await rows<{ kind: string; count: number }>(
    tx,
    sql`SELECT kind,count(*)::int AS count FROM organizations WHERE created_at>=${filter.start} AND created_at<${filter.end} GROUP BY kind ORDER BY count(*) DESC,kind`,
  );
  return { filter, ...(metrics ?? emptyUsage), daily, cohort, kinds };
}
type UsageMetrics = Pick<
  PlatformUsageReport,
  | 'organizerCount'
  | 'organizationCount'
  | 'activeOrganizationCount'
  | 'confirmedCount'
  | 'cancelledCount'
  | 'participantCount'
  | 'activityCount'
  | 'publishedCount'
>;
const emptyUsage: UsageMetrics = {
  organizerCount: 0,
  organizationCount: 0,
  activeOrganizationCount: 0,
  confirmedCount: 0,
  cancelledCount: 0,
  participantCount: 0,
  activityCount: 0,
  publishedCount: 0,
};
async function usageCohort(tx: Transaction, filter: PlatformReportInput) {
  const [cohort] = await rows<PlatformUsageReport['cohort']>(
    tx,
    sql`SELECT count(*)::int AS registered,
    count(*) FILTER(WHERE EXISTS(SELECT 1 FROM activities a WHERE a.organization_id=o.id AND a.created_at<${filter.end}))::int AS activity,
    count(*) FILTER(WHERE EXISTS(SELECT 1 FROM bookings b JOIN activities a ON a.id=b.activity_id AND a.organization_id=b.organization_id WHERE b.organization_id=o.id AND a.created_at<${filter.end} AND b.confirmed_at<${filter.end}))::int AS booking
    FROM organizations o WHERE o.created_at>=${filter.start} AND o.created_at<${filter.end}`,
  );
  return cohort ?? { registered: 0, activity: 0, booking: 0 };
}
