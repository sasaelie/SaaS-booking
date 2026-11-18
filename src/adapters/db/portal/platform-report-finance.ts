import { and, sql } from 'drizzle-orm';
import { rows, type Transaction } from '../transaction';
import { platformLedger, ledgerWhere } from './platform-ledger';
import { platformSearch } from './platform-filters';
import { PLATFORM_REPORTING } from '../../../config/platform-reporting';
import type { PlatformReportInput } from '../../../core/validation/platform-reporting';
import type {
  PlatformLedgerRow,
  PlatformFinanceSummary,
  PlatformReconciliationRow,
} from '../../../core/ports/platform-reporting';
export async function financeSummary(tx: Transaction, input: PlatformReportInput) {
  const [row] = await rows<PlatformFinanceSummary & { total: number }>(
    tx,
    sql`
    SELECT count(*)::int AS total,
    COALESCE(sum(l.amount_cents) FILTER(WHERE l.kind='SUBSCRIPTION'),0)::float8 AS "subscriptionCents",
    COALESCE(sum(l.amount_cents) FILTER(WHERE l.kind IN ('COMMISSION','COMMISSION_REFUND')),0)::float8 AS "commissionCents",
    COALESCE(sum(l.amount_cents) FILTER(WHERE l.kind='PROCESSING_FEE' AND l.scope='PLATFORM'),0)::float8 AS "feeCents",
    COALESCE(sum(l.amount_cents) FILTER(WHERE l.kind='COST'),0)::float8 AS "costCents",
    COALESCE(sum(l.amount_cents) FILTER(WHERE l.scope='PLATFORM'),0)::float8 AS "balanceCents",
    COALESCE(sum(l.amount_cents) FILTER(WHERE l.scope='ORGANIZER' AND l.kind IN ('PAYMENT','REFUND')),0)::float8 AS "organizerCents"
    FROM (${platformLedger}) l JOIN organizations ON organizations.id=l.organization_id WHERE ${ledgerWhere(input)}`,
  );
  return (
    row ?? {
      total: 0,
      subscriptionCents: 0,
      commissionCents: 0,
      feeCents: 0,
      costCents: 0,
      balanceCents: 0,
      organizerCents: 0,
    }
  );
}
export async function ledgerEntries(
  tx: Transaction,
  input: PlatformReportInput,
  page: number,
  exportAll: boolean,
) {
  const limit = exportAll ? PLATFORM_REPORTING.EXPORT_MAX + 1 : input.pageSize;
  const offset = exportAll ? 0 : (page - 1) * input.pageSize;
  const entries = await rows<PlatformLedgerRow>(
    tx,
    sql`SELECT l.id,l.organization_id AS "organizationId",organizations.name AS "organizationName",l.kind,l.scope,l.amount_cents AS "amountCents",l.reference,l.occurred_at AS "occurredAt",d.id AS "documentId",d.document_number AS "documentNumber",CASE WHEN l.amount_cents<0 THEN -d.net_cents ELSE d.net_cents END AS "invoiceNetCents",CASE WHEN l.amount_cents<0 THEN -d.tax_cents ELSE d.tax_cents END AS "invoiceTaxCents"
    FROM (${platformLedger}) l JOIN organizations ON organizations.id=l.organization_id
    LEFT JOIN platform_documents d ON d.organization_id=l.organization_id AND d.kind=CASE WHEN l.kind='COMMISSION' THEN 'INVOICE' ELSE 'CREDIT' END AND d.source_id=CASE WHEN l.kind IN ('COMMISSION','COMMISSION_REFUND') THEN replace(l.id,'commission:','')::uuid ELSE NULL END
    WHERE ${ledgerWhere(input)}
    ORDER BY l.occurred_at DESC,l.id DESC LIMIT ${limit} OFFSET ${offset}`,
  );
  return entries.map((row) => ({ ...row, occurredAt: new Date(row.occurredAt) }));
}
export async function reconciliationEntries(tx: Transaction, input: PlatformReportInput) {
  const where = and(
    sql`p.paid_at>=${input.start} AND p.paid_at<${input.end}`,
    platformSearch(input.search),
    input.organizationId ? sql`p.organization_id=${input.organizationId}::uuid` : undefined,
    input.status ? sql`p.status=${input.status}` : undefined,
  );
  const [count] = await rows<{ total: number }>(
    tx,
    sql`SELECT count(*)::int AS total FROM financial_payments p JOIN organizations ON organizations.id=p.organization_id WHERE ${where}`,
  );
  const total = count?.total ?? 0;
  const page = Math.min(input.page, Math.max(1, Math.ceil(total / input.pageSize)));
  const entries = await rows<PlatformReconciliationRow>(
    tx,
    sql`SELECT p.id,p.organization_id AS "organizationId",organizations.name AS "organizationName",p.status,p.paid_at AS "paidAt",p.public_amount_cents AS "grossCents",p.commission_cents AS "commissionCents",p.stripe_fee_cents AS "feeCents",p.organization_net_cents AS "netCents",p.payment_reference AS reference
    FROM financial_payments p JOIN organizations ON organizations.id=p.organization_id WHERE ${where}
    ORDER BY p.paid_at DESC,p.id DESC LIMIT ${input.pageSize} OFFSET ${(page - 1) * input.pageSize}`,
  );
  return { entries: entries.map((row) => ({ ...row, paidAt: new Date(row.paidAt) })), total, page };
}
