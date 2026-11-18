import { sql } from 'drizzle-orm';
import { rows, type Transaction } from '../transaction';
import type { PlatformBillableSource } from '../../../core/ports/platform-billing';
import type { PlatformDocumentSourceInput } from '../../../core/validation/platform-billing';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { ERROR_CODES } from '../../../config/constants';
export async function platformDocumentSource(tx: Transaction, input: PlatformDocumentSourceInput) {
  const source =
    input.kind === 'INVOICE'
      ? await commissionSource(tx, input.id)
      : await creditSource(tx, input.id);
  if (!source) return failure(ERROR_CODES.NOT_FOUND, 'PlatformDocument', 'source');
  if (input.kind === 'CREDIT' && !source.original)
    return failure(ERROR_CODES.CONFLICT, 'PlatformDocument', 'original-required');
  return ok({ ...source, kind: input.kind, occurredAt: new Date(source.occurredAt) });
}
const owner = sql`(SELECT u.email FROM organization_members m JOIN "user" u ON u.id=m.user_id WHERE m.organization_id=o.id AND m.role='OWNER' LIMIT 1)`;
async function commissionSource(tx: Transaction, id: string) {
  const [source] = await rows<Omit<PlatformBillableSource, 'kind'>>(
    tx,
    sql`SELECT p.id,p.id AS "paymentId",p.organization_id AS "organizationId",o.name AS "organizationName",${owner} AS "ownerEmail",p.commission_cents AS "amountCents",p.payment_reference AS reference,p.paid_at AS "occurredAt",NULL::jsonb AS original,d.id AS "existingDocumentId"
    FROM financial_payments p JOIN organizations o ON o.id=p.organization_id LEFT JOIN platform_documents d ON d.source_id=p.id AND d.kind='INVOICE'
    WHERE p.id=${id}::uuid AND p.commercial_plan='LIBERTE' AND p.commission_cents>0 AND p.paid_at IS NOT NULL AND p.status='RECONCILED'`,
  );
  return source;
}
async function creditSource(tx: Transaction, id: string) {
  const [source] = await rows<Omit<PlatformBillableSource, 'kind'>>(
    tx,
    sql`SELECT e.id,p.id AS "paymentId",e.organization_id AS "organizationId",o.name AS "organizationName",${owner} AS "ownerEmail",e.amount_cents AS "amountCents",e.reference,e.created_at AS "occurredAt",original.snapshot AS original,d.id AS "existingDocumentId"
    FROM financial_entries e JOIN organizations o ON o.id=e.organization_id JOIN financial_payments p ON p.booking_id=e.booking_id AND p.organization_id=e.organization_id
    LEFT JOIN platform_documents original ON original.source_id=p.id AND original.kind='INVOICE' AND original.organization_id=e.organization_id
    LEFT JOIN platform_documents d ON d.source_id=e.id AND d.kind='CREDIT'
    WHERE e.id=${id}::uuid AND e.kind='ADJUSTMENT' AND e.source_key LIKE 'commission-refund:%' AND e.amount_cents>0 AND p.commercial_plan='LIBERTE'`,
  );
  return source;
}
