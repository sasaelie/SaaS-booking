import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { activities } from '../../src/adapters/db/schema';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { DrizzlePaymentRepository } from '../../src/adapters/db/drizzle-payment.repository';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { required } from '../../src/adapters/db/transaction';
import { PAYMENT_MODES } from '../../src/config/constants';
export async function paidBooking(price = 3000) {
  const context = await fixture(PAYMENT_MODES.STRIPE, price);
  const booking = required(await reserve(rawInput(context)));
  required(
    await new DrizzlePaymentRepository(db).confirmPaymentOrDetectCollisionAtomically(
      {
        eventId: crypto.randomUUID(),
        provider: PAYMENT_MODES.STRIPE,
        bookingId: booking.bookingId,
        organizationId: context.organizationId,
        paymentReference: `pi_${booking.bookingId}`,
        checkoutReference: `cs_${booking.bookingId}`,
        amountPaidCents: price,
        currency: 'EUR',
        merchantAccountId: null,
      },
      new Date(),
    ),
  );
  return { context, booking };
}
export async function issuedVoucher(price = 3000) {
  const input = await paidBooking(price);
  const result = required(
    await new DrizzleVoucherRepository(db).cancelBookingAtomically({
      organizationId: input.context.organizationId,
      bookingId: input.booking.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-ABCD-EFGH',
      now: new Date(),
    }),
  );
  if (!result.voucher) throw Error('Voucher fixture missing');
  return { ...input, voucher: result.voucher };
}
export async function changePrice(context: Awaited<ReturnType<typeof fixture>>, price: number) {
  await db
    .update(activities)
    .set({ priceCents: price })
    .where(eq(activities.id, context.activityId));
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      context.organizationId,
      context.activityId,
    ),
  );
  return {
    ...context,
    terms: required(await generateDynamicTerms({ ...activity, activityName: activity.name })),
  };
}
