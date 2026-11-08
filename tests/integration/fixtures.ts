import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { activities, organizations, timeSlots } from '../../src/adapters/db/schema';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { DrizzleSessionRepository } from '../../src/adapters/db/drizzle-session.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { parseBookingInput } from '../../src/core/domain/booking-validation';
import { sha256 } from '../../src/lib/sha256';
import { required } from '../../src/adapters/db/transaction';
import { PAYMENT_MODES, type PaymentMode } from '../../src/config/constants';
import { db } from './database';
export async function fixture(mode: PaymentMode = PAYMENT_MODES.NONE, priceCents = 3000) {
  const organizationId = crypto.randomUUID();
  const activityId = crypto.randomUUID();
  const now = new Date();
  const startsAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 14),
  );
  await db.insert(organizations).values({
    id: organizationId,
    name: 'Test organization',
    slug: organizationId,
    timezone: 'UTC',
    bankIban: 'BE68539007547034',
    bankAccountName: 'Test organization',
    stripeReady: mode === PAYMENT_MODES.STRIPE,
    usesPlatformPayments: mode === PAYMENT_MODES.STRIPE,
  });
  await grantTestAccess(organizationId);
  await db.insert(activities).values({
    id: activityId,
    organizationId,
    name: 'Test activity',
    priceCents,
    paymentMode: mode,
    allowExternalBenefitExchange: true,
  });
  await db.insert(timeSlots).values({
    organizationId,
    activityId,
    dayOfWeek: startsAt.getUTCDay(),
    startTimeLocal: '14:00',
    endTimeLocal: '16:00',
    capacity: 5,
  });
  const terms = await fixtureTerms(organizationId, activityId);
  return { organizationId, activityId, startsAt, terms };
}
export function rawInput(context: Awaited<ReturnType<typeof fixture>>, key = crypto.randomUUID()) {
  return {
    organizationId: context.organizationId,
    activityId: context.activityId,
    startsAtIso: context.startsAt.toISOString(),
    idempotencyKey: key,
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test@example.com',
    phone: null,
    acceptedTerms: true,
    acceptedAgeAttestation: true,
    acceptedTermsVersionHash: context.terms.versionHash,
  };
}
export async function request(raw: unknown) {
  const input = required(parseBookingInput(raw));
  const requestHash = required(await sha256(JSON.stringify(input)));
  return { input, requestHash };
}
export async function reserve(raw: unknown) {
  return new DrizzleSessionRepository(db).reserveSeatAtomically(await request(raw));
}

async function grantTestAccess(organizationId: string) {
  await db.insert(organizationAccess).values({ organizationId, complimentary: true });
}

async function fixtureTerms(organizationId: string, activityId: string) {
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      organizationId,
      activityId,
    ),
  );
  const terms = required(await generateDynamicTerms({ ...activity, activityName: activity.name }));
  return terms;
}
