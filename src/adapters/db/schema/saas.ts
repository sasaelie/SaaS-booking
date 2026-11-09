import type { StoryTextTone } from '../../../config/story';
import { integer, boolean, pgTable, text, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { organizations } from './organization';
import { ACCESS_STATUSES, BRAND_THEMES } from '../../../config/constants';
export const organizationAccess = pgTable('organization_access', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizations.id),
  complimentary: boolean('complimentary').notNull().default(false),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  status: text('status').notNull().default(ACCESS_STATUSES.INACTIVE),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const organizationMembers = pgTable(
  'organization_members',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    userId: text('user_id').notNull(),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.userId] })],
);
export const organizationBranding = pgTable('organization_branding', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizations.id),
  organizerHue: integer('organizer_hue'),
  participantHue: integer('participant_hue'),
  storyTextTone: text('story_text_tone').$type<StoryTextTone>().notNull().default('WHITE'),
  theme: text('theme').notNull().default(BRAND_THEMES[0]),
  logoStorageKey: text('logo_storage_key'),
  backgroundStorageKey: text('background_storage_key'),
});
export const platformOperators = pgTable('platform_operators', {
  userId: text('user_id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const platformAudit = pgTable('platform_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  actorUserId: text('actor_user_id').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
