import { and, sql } from 'drizzle-orm';
import type { PlatformReportInput } from '../../../core/validation/platform-reporting';
import { platformSearch } from './platform-filters';
export const platformLedger = sql`
  SELECT e.id::text AS id,e.organization_id,
    CASE WHEN e.source_key LIKE 'commission-refund:%' THEN 'COMMISSION_REFUND'
      WHEN e.source_key LIKE 'stripe-fee:%' THEN 'PROCESSING_FEE' ELSE e.kind END AS kind,
    CASE WHEN e.kind='SUBSCRIPTION' OR e.source_key LIKE 'commission-refund:%'
      OR (e.source_key LIKE 'stripe-fee:%' AND b.commercial_plan='LIBERTE') THEN 'PLATFORM'
      WHEN e.kind IN ('VOUCHER_ISSUED','VOUCHER_USED') THEN 'CREDIT' ELSE 'ORGANIZER' END AS scope,
    CASE WHEN e.source_key LIKE 'commission-refund:%' THEN -e.amount_cents ELSE e.amount_cents END AS amount_cents,
    e.reference,e.created_at AS occurred_at
  FROM financial_entries e LEFT JOIN bookings b ON b.id=e.booking_id AND b.organization_id=e.organization_id
  UNION ALL
  SELECT 'commission:'||p.id::text,p.organization_id,'COMMISSION','PLATFORM',p.commission_cents,
    p.payment_reference,p.paid_at FROM financial_payments p
    WHERE p.commercial_plan='LIBERTE' AND p.commission_cents>0 AND p.paid_at IS NOT NULL AND p.reconciled_at IS NOT NULL
  UNION ALL
  SELECT 'cost:'||c.id::text,c.organization_id,'COST','PLATFORM',-c.amount_cents,c.source_reference,c.occurred_at FROM platform_costs c`;
export function ledgerWhere(input: PlatformReportInput) {
  return and(
    sql`l.occurred_at>=${input.start} AND l.occurred_at<${input.end}`,
    platformSearch(input.search),
    input.organizationId ? sql`l.organization_id=${input.organizationId}::uuid` : undefined,
    input.scope ? sql`l.scope=${input.scope}` : undefined,
    input.kind ? sql`l.kind=${input.kind}` : undefined,
  );
}
