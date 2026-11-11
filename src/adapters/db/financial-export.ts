import { eq, asc } from 'drizzle-orm';
import type { Executor } from './transaction';
import { financialPayments, financialEntries } from './schema';
function cell(value: unknown): string {
  if (value == null) return '';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const safe = typeof value === 'string' && /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export async function financialCsv(db: Executor, id: string) {
  const payments = await db
    .select()
    .from(financialPayments)
    .where(eq(financialPayments.organizationId, id))
    .orderBy(asc(financialPayments.createdAt));
  const entries = await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.organizationId, id))
    .orderBy(asc(financialEntries.createdAt));
  const rows = [...payments.map(paymentRow), ...entries.map(entryRow)];
  return '\uFEFF' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

const header = [
  'type',
  'reservation',
  'formule',
  'version',
  'devise',
  'brut_centimes',
  'commission_centimes',
  'tva_commission_centimes',
  'stripe_reel_centimes',
  'net_du_association_centimes',
  'rembourse_centimes',
  'statut',
  'date',
  'paiement',
  'balance_transaction',
  'transfert',
  'versement_bancaire',
  'montant_ecriture_centimes',
  'net_transfere_centimes',
  'etat_versement',
  'commission_restituee_centimes',
];

function paymentRow(p: typeof financialPayments.$inferSelect) {
  return [
    'VENTE',
    p.bookingId,
    p.commercialPlan,
    p.pricingVersion,
    p.currency,
    p.publicAmountCents,
    p.commissionCents,
    p.commissionTaxCents,
    p.stripeFeeCents,
    p.organizationNetCents,
    p.refundedCents,
    p.status,
    p.paidAt,
    p.paymentReference,
    p.balanceTransactionId,
    p.transferId,
    p.payoutId,
    null,
    p.transferredCents,
    p.payoutStatus,
    p.commissionRefundedCents,
  ];
}

function entryRow(entry: typeof financialEntries.$inferSelect) {
  return [
    entry.kind,
    entry.bookingId,
    '',
    '',
    entry.currency,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    entry.createdAt,
    entry.reference,
    '',
    '',
    '',
    entry.kind === 'SUBSCRIPTION' ? -entry.amountCents : entry.amountCents,
    null,
    null,
    null,
  ];
}
