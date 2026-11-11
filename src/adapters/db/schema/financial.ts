import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { CommercialPlan } from '../../../config/commercial';
export const financialPayments = pgTable('financial_payments', {
  transferredCents: integer('transferred_cents'),
  payoutStatus: text('payout_status'),
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  bookingId: uuid('booking_id').notNull(),
  commercialPlan: text('commercial_plan').$type<CommercialPlan>().notNull(),
  pricingVersion: text('pricing_version').notNull(),
  currency: text('currency').notNull(),
  publicAmountCents: integer('public_amount_cents').notNull(),
  commissionCents: integer('commission_cents').notNull(),
  commissionTaxCents: integer('commission_tax_cents'),
  stripeFeeCents: integer('stripe_fee_cents'),
  organizationNetCents: integer('organization_net_cents'),
  refundedCents: integer('refunded_cents').notNull().default(0),
  commissionRefundedCents: integer('commission_refunded_cents').notNull().default(0),
  status: text('status').notNull().default('PENDING'),
  paymentReference: text('payment_reference'),
  merchantAccountId: text('merchant_account_id'),
  chargeAccountId: text('charge_account_id'),
  chargeId: text('charge_id'),
  balanceTransactionId: text('balance_transaction_id'),
  transferId: text('transfer_id'),
  payoutId: text('payout_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const financialEntries = pgTable('financial_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  bookingId: uuid('booking_id'),
  sourceKey: text('source_key').notNull(),
  kind: text('kind').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  reference: text('reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const accountingArchives = pgTable('accounting_archives', {
  bookingId: uuid('booking_id').primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  requiredIdentity: jsonb('required_identity')
    .$type<{ firstName: string; lastName: string }>()
    .notNull(),
  archiveUntil: timestamp('archive_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const platformCosts = pgTable('platform_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  category: text('category').notNull(),
  amountCents: integer('amount_cents').notNull(),
  sourceReference: text('source_reference').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
