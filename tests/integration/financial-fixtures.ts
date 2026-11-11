import { eq } from 'drizzle-orm';
import { db } from './database';
import { portalFixture, recurringActivity } from './portal-fixtures';
import { organizations } from '../../src/adapters/db/schema';
import { rawInput, reserve } from './fixtures';
import { required } from '../../src/adapters/db/transaction';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { DrizzlePaymentRepository } from '../../src/adapters/db/drizzle-payment.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { DrizzleFinancialRepository } from '../../src/adapters/db/drizzle-financial.repository';
export async function financialFixture() {
  const owner = await portalFixture();
  await db
    .update(organizations)
    .set({ stripeReady: true, merchantAccountId: 'acct_fixture' })
    .where(eq(organizations.id, owner.organizationId));
  const input = recurringActivity(owner.organizationId);
  const created = required(
    await owner.repository.createActivity(owner.actor, {
      ...input,
      paymentMode: 'STRIPE',
      priceCents: 3000,
      schedule: {
        ...input.schedule,
        slots: input.schedule.slots.map((slot) => ({ ...slot, capacity: 50 })),
      },
    }),
  );
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      owner.organizationId,
      created.activityId,
    ),
  );
  const startsAt = (await import('../../src/core/domain/public-booking-page')).publicSchedule(
    activity,
    new Date(),
  );
  const first = required(startsAt)[0];
  if (!first) throw Error('Missing test session');
  return {
    ...owner,
    activityId: created.activityId,
    startsAt: first.startsAt,
    terms: required(await generateDynamicTerms({ ...activity, activityName: activity.name })),
    financial: new DrizzleFinancialRepository(db),
  };
}
export async function pay(context: Awaited<ReturnType<typeof financialFixture>>) {
  const booking = required(await reserve(rawInput(context)));
  const paymentReference = `pi_${booking.bookingId}`;
  required(
    await new DrizzlePaymentRepository(db).confirmPaymentOrDetectCollisionAtomically(
      {
        eventId: `evt_${booking.bookingId}`,
        provider: 'STRIPE',
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        paymentReference,
        checkoutReference: `cs_${booking.bookingId}`,
        amountPaidCents: 3000,
        currency: 'EUR',
        merchantAccountId: 'acct_fixture',
      },
      new Date(),
    ),
  );
  return booking;
}
