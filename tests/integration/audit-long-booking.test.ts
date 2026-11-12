import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput } from './fixtures';
import { activities } from '../../src/adapters/db/schema';
import { DrizzleSessionRepository } from '../../src/adapters/db/drizzle-session.repository';
import { CreateBookingUseCase } from '../../src/core/use-cases/create-booking.use-case';
import { verifySelfCancelToken } from '../../src/core/domain/self-service-token';
import { mailContent } from '../../src/adapters/jobs/mail-content';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
const secret = 'long-event-synthetic-test-secret-not-production';
it.each(['response', 'confirmation'] as const)(
  'keeps the %s management link valid until a distant event',
  async (source) => {
    const context = await fixture();
    const startsAt = new Date(context.startsAt.getTime() + 140 * 86400000);
    await db
      .update(activities)
      .set({ bookingWindowWeeks: 52 })
      .where(eq(activities.id, context.activityId));
    const booking = required(
      await new CreateBookingUseCase({
        sessionRepo: new DrizzleSessionRepository(db),
        secret,
        appUrl: 'https://example.com',
        paymentGateway: {
          mode: 'STRIPE',
          initiatePayment: async () => {
            throw Error('Must never charge');
          },
          refundPayment: async () => {
            throw Error('Must never refund');
          },
          verifyWebhookAndParse: async () => ok(null),
        },
      }).execute({ ...rawInput(context), startsAtIso: startsAt.toISOString() }),
    );
    const content = await mailContent(
      db,
      'CONFIRMATION',
      { bookingId: booking.bookingId },
      'https://example.com',
      secret,
    );
    const token =
      source === 'response'
        ? booking.selfServiceToken
        : decodeURIComponent(content?.text.match(/#token=([^\s]+)/)?.[1] ?? '');
    expect(
      (await verifySelfCancelToken(token ?? '', secret, new Date(startsAt.getTime() - 86400000)))
        .ok,
    ).toBe(true);
  },
);
