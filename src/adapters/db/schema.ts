// src/adapters/db/schema.ts
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  AUDIENCE_POLICIES,
  BOOKING_LIMITS,
  BOOKING_STATUSES,
  DEFAULT_PAYMENT_MODE,
  VOUCHER_RULES,
  VOUCHER_STATUSES,
  type AudiencePolicy,
  type BookingStatus,
  type PaymentMode,
  type VoucherStatus,
} from '../../config/constants';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  timezone: text('timezone').notNull().default('Europe/Brussels'),
  primaryTextColor: text('primary_text_color').notNull().default('#143D2B'),
  merchantAccountId: text('merchant_account_id'),
  bankIban: text('bank_iban'),
  bankAccountName: text('bank_account_name'),
  autoDeleteBankProof: boolean('auto_delete_bank_proof')
    .notNull()
    .default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  audiencePolicy: text('audience_policy')
    .$type<AudiencePolicy>()
    .notNull()
    .default(AUDIENCE_POLICIES.ALL_PUBLIC),
  requirePhone: boolean('require_phone').notNull().default(false),
  paymentMode: text('payment_mode')
    .$type<PaymentMode>()
    .notNull()
    .default(DEFAULT_PAYMENT_MODE),
  bookingWindowWeeks: integer('booking_window_weeks')
    .notNull()
    .default(BOOKING_LIMITS.DEFAULT_BOOKING_WINDOW_WEEKS),
  noticeHoursForVoucher: integer('notice_hours_for_voucher')
    .notNull()
    .default(VOUCHER_RULES.DEFAULT_NOTICE_HOURS),
  voucherValidityMonths: integer('voucher_validity_months')
    .notNull()
    .default(VOUCHER_RULES.DEFAULT_VALIDITY_MONTHS),
  allowExternalBenefitExchange: boolean('allow_external_benefit_exchange')
    .notNull()
    .default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const timeSlots = pgTable('time_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => activities.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTimeLocal: text('start_time_local').notNull(),
  endTimeLocal: text('end_time_local').notNull(),
  capacity: integer('capacity').notNull(),
});
export const pausePeriods = pgTable('pause_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => activities.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
});
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    capacity: integer('capacity').notNull(),
    isManual: boolean('is_manual').notNull().default(false),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('uq_session_activity_start').on(t.activityId, t.startsAt),
    index('idx_session_org_starts').on(t.organizationId, t.startsAt),
  ],
);
export const rescheduleVouchers = pgTable('reschedule_vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  originActivityId: uuid('origin_activity_id')
    .notNull()
    .references(() => activities.id),
  originBookingId: uuid('origin_booking_id').notNull(),
  code: text('code').notNull().unique(),
  initialValueCents: integer('initial_value_cents').notNull(),
  status: text('status')
    .$type<VoucherStatus>()
    .notNull()
    .default(VOUCHER_STATUSES.ACTIVE),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    status: text('status')
      .$type<BookingStatus>()
      .notNull()
      .default(BOOKING_STATUSES.PENDING_PAYMENT),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
    unitPriceCents: integer('unit_price_cents').notNull(),
    voucherDiscountCents: integer('voucher_discount_cents')
      .notNull()
      .default(0),
    amountPaidCents: integer('amount_paid_cents').notNull(),
    appliedVoucherId: uuid('applied_voucher_id').references(
      () => rescheduleVouchers.id,
    ),
    paymentReference: text('payment_reference').unique(),
    proofStorageKey: text('proof_storage_key'),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    termsAcceptedAt: timestamp('terms_accepted_at', {
      withTimezone: true,
    }).notNull(),
    termsVersionHash: text('terms_version_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('idx_booking_session_status').on(t.sessionId, t.status)],
);
export const processedWebhooks = pgTable('processed_webhooks', {
  eventId: text('event_id').primaryKey(),
  provider: text('provider').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
