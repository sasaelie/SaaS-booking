import { and, sql } from 'drizzle-orm';
import { rows, type Transaction } from '../transaction';
import { platformSearch } from './platform-filters';
import type { PlatformReportInput } from '../../../core/validation/platform-reporting';
import type { PlatformDocumentListRow } from '../../../core/ports/platform-billing';
export async function platformDocuments(tx: Transaction, input: PlatformReportInput) {
  const source = sql`SELECT id,organization_id,kind,document_number AS number,gross_cents AS amount_cents,issued_at FROM platform_documents
    UNION ALL SELECT id,organization_id,'PROVIDER',reference,amount_cents,created_at FROM financial_entries WHERE kind='SUBSCRIPTION' AND amount_cents>0 AND reference LIKE 'in_%'`;
  const where = and(
    sql`d.issued_at>=${input.start} AND d.issued_at<${input.end}`,
    platformSearch(input.search),
    input.organizationId ? sql`d.organization_id=${input.organizationId}::uuid` : undefined,
  );
  const [count] = await rows<{ total: number }>(
    tx,
    sql`SELECT count(*)::int AS total FROM (${source}) d JOIN organizations ON organizations.id=d.organization_id WHERE ${where}`,
  );
  const total = count?.total ?? 0;
  const page = Math.min(input.page, Math.max(1, Math.ceil(total / input.pageSize)));
  const entries = await rows<PlatformDocumentListRow>(
    tx,
    sql`SELECT d.id,d.kind,d.number,organizations.name AS "organizationName",d.amount_cents AS "amountCents",d.issued_at AS "issuedAt" FROM (${source}) d JOIN organizations ON organizations.id=d.organization_id WHERE ${where} ORDER BY d.issued_at DESC,d.id DESC LIMIT ${input.pageSize} OFFSET ${(page - 1) * input.pageSize}`,
  );
  return {
    entries: entries.map((row) => ({ ...row, issuedAt: new Date(row.issuedAt) })),
    total,
    page,
  };
}
