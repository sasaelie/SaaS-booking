import {
  jsonb,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';
import type { SocialLinks } from '../../../core/ports/event-details';
import {
  AUDIENCE_POLICIES,
  BOOKING_LIMITS,
  DEFAULT_PAYMENT_MODE,
  DEFAULTS,
  VOUCHER_RULES,
  type AudiencePolicy,
  type PaymentMode,
} from '../../../config/constants';
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  socialLinks: jsonb('social_links').$type<SocialLinks>().notNull().default({}),
  kind: text('kind').notNull().default('OTHER'),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  timezone: text('timezone').notNull().default(DEFAULTS.TIMEZONE),
  primaryTextColor: text('primary_text_color').notNull().default(DEFAULTS.TEXT_COLOR),
  merchantAccountId: text('merchant_account_id'),
  stripeReady: boolean('stripe_ready').notNull().default(false),
  usesPlatformPayments: boolean('uses_platform_payments').notNull().default(false),
  bankIban: text('bank_iban'),
  bankAccountName: text('bank_account_name'),
  autoDeleteBankProof: boolean('auto_delete_bank_proof').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    address: text('address').notNull().default(''),
    addressVisibility: text('address_visibility')
      .$type<'PUBLIC' | 'REMINDER'>()
      .notNull()
      .default('PUBLIC'),
    practicalInfo: text('practical_info').notNull().default(''),
    participationTerms: text('participation_terms').notNull().default(''),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull().default(DEFAULTS.CURRENCY),
    audiencePolicy: text('audience_policy')
      .$type<AudiencePolicy>()
      .notNull()
      .default(AUDIENCE_POLICIES.ALL_PUBLIC),
    requirePhone: boolean('require_phone').notNull().default(false),
    paymentMode: text('payment_mode').$type<PaymentMode>().notNull().default(DEFAULT_PAYMENT_MODE),
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('activity_tenant').on(table.id, table.organizationId)],
);
