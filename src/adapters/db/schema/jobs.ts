import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
export const processedWebhooks = pgTable('processed_webhooks', {
  eventId: text('event_id').primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  provider: text('provider').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
});
export const outboxJobs = pgTable('outbox_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  type: text('type').notNull(),
  deduplicationKey: text('deduplication_key').notNull().unique(),
  payload: jsonb('payload').$type<unknown>().notNull(),
  attempts: integer('attempts').notNull().default(0),
  availableAt: timestamp('available_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
