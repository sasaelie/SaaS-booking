import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { activities } from './organization';
export const timeSlots = pgTable(
  'time_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    activityId: uuid('activity_id').notNull(),
    dayOfWeek: integer('day_of_week').notNull(),
    startTimeLocal: text('start_time_local').notNull(),
    endTimeLocal: text('end_time_local').notNull(),
    capacity: integer('capacity').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.activityId, table.organizationId],
      foreignColumns: [activities.id, activities.organizationId],
    }).onDelete('restrict'),
  ],
);
export const pausePeriods = pgTable(
  'pause_periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    activityId: uuid('activity_id').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    reason: text('reason'),
  },
  (table) => [
    foreignKey({
      columns: [table.activityId, table.organizationId],
      foreignColumns: [activities.id, activities.organizationId],
    }).onDelete('restrict'),
  ],
);
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    activityId: uuid('activity_id').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    capacity: integer('capacity').notNull(),
    isManual: boolean('is_manual').notNull().default(false),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_session_activity_start').on(table.activityId, table.startsAt),
    unique('session_tenant_activity').on(table.id, table.activityId, table.organizationId),
    index('idx_session_org_starts').on(table.organizationId, table.startsAt),
    foreignKey({
      columns: [table.activityId, table.organizationId],
      foreignColumns: [activities.id, activities.organizationId],
    }).onDelete('restrict'),
  ],
);
