import { integer, pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { VOUCHER_STATUSES, type VoucherStatus } from '../../../config/constants';
export const rescheduleVouchers = pgTable(
  'reschedule_vouchers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    originActivityId: uuid('origin_activity_id').notNull(),
    originBookingId: uuid('origin_booking_id').notNull(),
    kind: text('kind').notNull().default('CANCELLATION'),
    sourceVoucherId: uuid('source_voucher_id'),
    code: text('code').notNull().unique(),
    initialValueCents: integer('initial_value_cents').notNull(),
    currency: text('currency').notNull(),
    status: text('status').$type<VoucherStatus>().notNull().default(VOUCHER_STATUSES.ACTIVE),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lockedBookingId: uuid('locked_booking_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('voucher_tenant').on(table.id, table.organizationId)],
);
