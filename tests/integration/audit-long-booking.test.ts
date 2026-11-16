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
import { ParticipantAccessRepository } from '../../src/adapters/db/participant/repository';
const secret = 'long-event-synthetic-test-secret-not-production';
const paymentGateway = {
  mode: 'STRIPE' as const,
  initiatePayment: async () => {
    throw Error('Must never charge');
  },
  refundPayment: async () => {
    throw Error('Must never refund');
  },
  verifyWebhookAndParse: async () => ok(null),
};

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
        paymentGateway,
      }).execute({ ...rawInput(context), startsAtIso: startsAt.toISOString() }),
    );
    const content = await mailContent(
      db,
      'CONFIRMATION',
      { bookingId: booking.bookingId },
      'https://example.com',
      secret,
    );
    const when = new Date(startsAt.getTime() - 86400000);
    const valid =
      source === 'response'
        ? await verifySelfCancelToken(booking.selfServiceToken ?? '', secret, when)
        : await new ParticipantAccessRepository(db, secret, 'https://example.com').authorizeCode(
            decodeURIComponent(content?.text.match(/#code=([^\s]+)/)?.[1] ?? ''),
            when,
          );
    expect(valid.ok).toBe(true);
  },
);
