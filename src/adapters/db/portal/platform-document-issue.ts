import { sql } from 'drizzle-orm';
import { rows, required, type Transaction } from '../transaction';
import { platformDocumentSource } from './platform-document-source';
import type { PortalActor } from '../../../core/ports/portal-models';
import type {
  PlatformDocumentSnapshot,
  PlatformInvoicePdfPort,
  PlatformBillableSource,
  InvoiceAmounts,
} from '../../../core/ports/platform-billing';
import type {
  IssuePlatformDocument,
  PlatformBillingSettings,
} from '../../../core/validation/platform-billing';
import { invoiceAmounts, creditAmounts } from '../../../core/domain/platform-invoice';
import { PLATFORM_BILLING as BILL } from '../../../config/platform-billing';
import { PLATFORM_REPORTING } from '../../../config/platform-reporting';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
export async function issuePlatformDocument(
  tx: Transaction,
  actor: PortalActor,
  input: IssuePlatformDocument,
  pdf: PlatformInvoicePdfPort,
) {
  const initial = required(
    await platformDocumentSource(tx, { id: input.sourceId, kind: input.kind }),
  );
  await tx.execute(
    sql`SELECT id FROM financial_payments WHERE id=${initial.paymentId}::uuid FOR UPDATE`,
  );
  const source = required(
    await platformDocumentSource(tx, { id: input.sourceId, kind: input.kind }),
  );
  if (source.existingDocumentId) return ok({ id: source.existingDocumentId });
  const [settings] = await rows<{ profile: PlatformBillingSettings }>(
    tx,
    sql`SELECT profile FROM platform_billing_settings WHERE id=1 FOR SHARE`,
  );
  if (!settings) return failure(ERROR_CODES.CONFIGURATION_ERROR, 'PlatformInvoice', 'issuer');
  if (input.kind === 'INVOICE' && input.taxRateBps > 0 && !settings.profile.vatNumber)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformInvoice', 'issuer-vat');
  const snapshot = await documentSnapshot(tx, source, input, settings.profile);
  const bytes = required(await pdf.build(snapshot));
  if (bytes.byteLength > BILL.MAX_PDF_BYTES)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformInvoice', 'file-size');
  await insertDocument(tx, actor, snapshot, bytes);
  return ok({ id: snapshot.id });
}
async function documentSnapshot(
  tx: Transaction,
  source: PlatformBillableSource,
  input: IssuePlatformDocument,
  issuer: PlatformBillingSettings,
): Promise<PlatformDocumentSnapshot> {
  const parties = documentParties(source, input, issuer);
  const amounts =
    input.kind === 'INVOICE'
      ? required(invoiceAmounts(source.amountCents, parties.taxRateBps))
      : await creditSplit(tx, source, parties.taxRateBps);
  const issuedAt = new Date();
  const numbering = await documentNumber(tx, input.kind, issuer.prefix, issuedAt);
  return {
    ...parties,
    ...amounts,
    ...numbering,
    id: crypto.randomUUID(),
    kind: input.kind,
    issuedAt: issuedAt.toISOString(),
  };
}
function documentParties(
  source: PlatformBillableSource,
  input: IssuePlatformDocument,
  issuer: PlatformBillingSettings,
) {
  const original = source.original;
  return {
    organizationId: source.organizationId,
    organizationName: source.organizationName,
    sourceId: input.sourceId,
    sourceReference: source.reference,
    sourceOccurredAt: source.occurredAt.toISOString(),
    originalDocumentId: original?.id ?? null,
    originalNumber: original?.number ?? null,
    issuer: input.kind === 'CREDIT' && original ? original.issuer : issuer,
    recipient: input.kind === 'INVOICE' ? input.recipient : requiredRecipient(original),
    taxRateBps: input.kind === 'INVOICE' ? input.taxRateBps : (original?.taxRateBps ?? 0),
    taxNote: input.kind === 'INVOICE' ? input.taxNote : (original?.taxNote ?? ''),
  };
}
async function documentNumber(
  tx: Transaction,
  kind: 'INVOICE' | 'CREDIT',
  prefix: string,
  issuedAt: Date,
) {
  const documentYear = Number(
    new Intl.DateTimeFormat('en', {
      timeZone: PLATFORM_REPORTING.TIMEZONE,
      year: 'numeric',
    }).format(issuedAt),
  );
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`platform-document:${documentYear}:${kind}`},0))`,
  );
  const [counter] = await rows<{ next: number }>(
    tx,
    sql`SELECT COALESCE(max(sequence),0)+1 AS next FROM platform_documents WHERE document_year=${documentYear} AND kind=${kind}`,
  );
  const sequence = counter?.next ?? 1;
  return {
    documentYear,
    sequence,
    number: `${kind === 'CREDIT' ? BILL.CREDIT_PREFIX : prefix}-${documentYear}-${String(sequence).padStart(BILL.NUMBER_WIDTH, '0')}`,
  };
}
function requiredRecipient(original: PlatformDocumentSnapshot | null) {
  if (!original) return required(failure(ERROR_CODES.CONFLICT, 'PlatformInvoice', 'original'));
  return original.recipient;
}
async function creditSplit(tx: Transaction, source: PlatformBillableSource, rate: number) {
  if (!source.original)
    return required(failure(ERROR_CODES.CONFLICT, 'PlatformInvoice', 'original'));
  const [previous] = await rows<InvoiceAmounts>(
    tx,
    sql`SELECT COALESCE(sum(gross_cents),0)::float8 AS "grossCents",COALESCE(sum(net_cents),0)::float8 AS "netCents",COALESCE(sum(tax_cents),0)::float8 AS "taxCents" FROM platform_documents WHERE original_document_id=${source.original.id}::uuid`,
  );
  return required(
    creditAmounts(
      source.amountCents,
      source.original,
      previous ?? { grossCents: 0, netCents: 0, taxCents: 0 },
      rate,
    ),
  );
}
async function insertDocument(
  tx: Transaction,
  actor: PortalActor,
  snapshot: PlatformDocumentSnapshot,
  bytes: Uint8Array,
) {
  await tx.execute(sql`INSERT INTO platform_documents(id,organization_id,kind,source_id,source_payment_id,source_entry_id,original_document_id,document_number,document_year,sequence,gross_cents,net_cents,tax_cents,snapshot,pdf,issued_at,issued_by)
    VALUES(${snapshot.id}::uuid,${snapshot.organizationId}::uuid,${snapshot.kind},${snapshot.sourceId}::uuid,${snapshot.kind === 'INVOICE' ? snapshot.sourceId : null}::uuid,${snapshot.kind === 'CREDIT' ? snapshot.sourceId : null}::uuid,${snapshot.originalDocumentId}::uuid,${snapshot.number},${snapshot.documentYear},${snapshot.sequence},${snapshot.grossCents},${snapshot.netCents},${snapshot.taxCents},${JSON.stringify(snapshot)}::jsonb,${Buffer.from(bytes)},${new Date(snapshot.issuedAt)},${actor.id})`);
  await tx.execute(
    sql`INSERT INTO platform_audit(organization_id,actor_user_id,action) VALUES(${snapshot.organizationId}::uuid,${actor.id},${snapshot.kind === 'INVOICE' ? 'PLATFORM_INVOICE_ISSUED' : 'PLATFORM_CREDIT_ISSUED'})`,
  );
}
