import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, sessions } from '../../src/adapters/db/schema';
import { ParticipantAccessRepository } from '../../src/adapters/db/participant/repository';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { required } from '../../src/adapters/db/transaction';
export const secret = 'participant-access-integration-only-secret-at-least-32';
export const repository = () => new ParticipantAccessRepository(db, secret, 'https://example.test');
export async function confirmed() {
  const context = await fixture();
  const input = rawInput(context);
  const booking = required(await reserve(input));
  const payload = {
    organizationId: context.organizationId,
    bookingId: booking.bookingId,
    version: 0,
    expUnixSeconds: Number.MAX_SAFE_INTEGER,
  };
  const ticket = required(await repository().ticket(payload, new Date()));
  if (!ticket) throw Error('Ticket missing');
  return { context, input, booking, payload, ticket };
}
export async function withVoucher() {
  const setup = await confirmed();
  await db
    .update(bookings)
    .set({ amountPaidCents: 3000, paidAt: new Date() })
    .where(eq(bookings.id, setup.booking.bookingId));
  const result = required(
    await new DrizzleVoucherRepository(db).cancelBookingAtomically({
      ...setup.payload,
      adminOverride: false,
      code: 'RPT-TEST-ABCD',
      now: new Date(),
    }),
  );
  if (!result.voucher) throw Error('Voucher missing');
  return { ...setup, voucher: result.voucher };
}
export async function past(sessionId: string) {
  await db
    .update(sessions)
    .set({ startsAt: new Date(Date.now() - 172800000), endsAt: new Date(Date.now() - 86400000) })
    .where(eq(sessions.id, sessionId));
}

import { activities } from '../../src/adapters/db/schema';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { and } from 'drizzle-orm';

export async function cheaperReservation(setup: Awaited<ReturnType<typeof withVoucher>>) {
  await db
    .update(activities)
    .set({ priceCents: 1500 })
    .where(
      and(
        eq(activities.id, setup.context.activityId),
        eq(activities.organizationId, setup.context.organizationId),
      ),
    );
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      setup.context.organizationId,
      setup.context.activityId,
    ),
  );
  const terms = required(await generateDynamicTerms({ ...activity, activityName: activity.name }));
  const raw = {
    ...rawInput(setup.context),
    voucherCode: setup.ticket.code,
    acceptedTermsVersionHash: terms.versionHash,
  };
  return raw;
}
