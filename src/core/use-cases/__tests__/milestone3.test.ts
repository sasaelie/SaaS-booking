// src/core/use-cases/__tests__/milestone3.test.ts
import { describe, expect, it } from 'vitest';
import {
  StripePaymentAdapter,
  type StripeSdkClient,
  type StripeWebhookEventObject,
} from '../../../adapters/payments/stripe-payment.adapter';
import { ERROR_CODES } from '../../../config/constants';
import { ok } from '../../../lib/result';
import type { NotificationPort } from '../../ports/booking-ports';
import type {
  AtomicConfirmOutcome,
  BookingPaymentRepositoryPort,
} from '../../ports/payment-gateway.port';
import { HandlePaymentWebhookUseCase } from '../handle-stripe-webhook.use-case';
function createMockStripeSdk() {
  const createdSessions: unknown[] = [];
  const refundsCreated: unknown[] = [];
  const sdk: StripeSdkClient = {
    checkout: {
      sessions: {
        async create(params) {
          createdSessions.push(params);
          return {
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/c/pay/cs_test_123',
            payment_intent: 'pi_test_999',
            amount_total: params.line_items[0]?.price_data.unit_amount ?? 3000,
            metadata: params.metadata,
          };
        },
      },
    },
    refunds: {
      async create(params) {
        refundsCreated.push(params);
        return { id: 're_auto_refund_001' };
      },
    },
    webhooks: {
      constructEvent(payload, header, secret): StripeWebhookEventObject {
        if (header !== `valid_sig_${secret}`)
          throw new Error('Invalid Stripe HMAC signature');
        return JSON.parse(payload) as StripeWebhookEventObject;
      },
    },
  };
  return { sdk, createdSessions, refundsCreated };
}
describe('Jalon 3 — Stripe (30 min + customer_email), Webhook signé idempotent & Remboursement auto', () => {
  const SECRET = 'whsec_studio360';
  it('transmet customer_email et verrouille expires_at à +30 minutes lors de initiatePayment', async () => {
    const { sdk, createdSessions } = createMockStripeSdk();
    const adapter = new StripePaymentAdapter(sdk, SECRET);
    const expiresAt = new Date('2026-11-09T10:30:00.000Z');
    const res = await adapter.initiatePayment({
      organizationId: 'org-studio-360',
      bookingId: 'book-adult-1',
      activityName: 'Cours de couture débutants — Adultes',
      amountCents: 3000,
      currency: 'EUR',
      customerEmail: 'elie@example.com',
      expiresAt,
      successUrl: 'https://studio360.be/success',
      cancelUrl: 'https://studio360.be/cancel',
      merchantAccountId: null,
    });
    expect(res.ok).toBe(true);
    expect(createdSessions).toHaveLength(1);
    const call = createdSessions[0] as {
      customer_email: string;
      expires_at: number;
    };
    expect(call.customer_email).toBe('elie@example.com');
    expect(call.expires_at).toBe(Math.floor(expiresAt.getTime() / 1000));
  });
  it('rejette avec UNAUTHORIZED tout appel webhook dont la signature cryptographique est invalide', async () => {
    const { sdk } = createMockStripeSdk();
    const res = await new StripePaymentAdapter(
      sdk,
      SECRET,
    ).verifyWebhookAndParse('{}', 'forged_signature');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });
  it('garantit l’idempotence sur double réception du même event.id et déclenche le remboursement automatique en cas de collision sur la dernière place', async () => {
    const { sdk, refundsCreated } = createMockStripeSdk();
    const adapter = new StripePaymentAdapter(sdk, SECRET);
    const processedEvents = new Set<string>();
    let simulateCollision = false;
    let emailsSent = 0;
    const paymentRepo: BookingPaymentRepositoryPort = {
      async confirmPaymentOrDetectCollisionAtomically(
        event,
      ): Promise<
        ReturnType<
          BookingPaymentRepositoryPort['confirmPaymentOrDetectCollisionAtomically']
        >
      > {
        if (processedEvents.has(event.eventId))
          return ok({ status: 'ALREADY_PROCESSED' });
        processedEvents.add(event.eventId);
        if (simulateCollision) {
          const collisionOutcome: AtomicConfirmOutcome = {
            status: 'COLLISION_OVERBOOKED',
            bookingId: event.bookingId,
            attendeeEmail: 'late@example.com',
          };
          return ok(collisionOutcome);
        }
        return ok({
          status: 'CONFIRMED_NOW',
          bookingId: event.bookingId,
          organizationName: 'ASBL Studio Créatif 360',
          activityName: 'Cours Adultes',
          attendeeFirstName: 'Sophie',
          attendeeEmail: 'sophie@example.com',
          startsAt: new Date('2026-11-14T13:00:00.000Z'),
          endsAt: new Date('2026-11-14T16:00:00.000Z'),
          timezone: 'Europe/Brussels',
          amountPaidCents: 3000,
          currency: 'EUR',
        });
      },
    };
    const notificationPort: NotificationPort = {
      async sendBookingConfirmation() {
        emailsSent += 1;
        return ok({ messageId: 'msg-ok' });
      },
    };
    const useCase = new HandlePaymentWebhookUseCase({
      paymentGateway: adapter,
      paymentRepo,
      notificationPort,
    });
    const payload1 = JSON.stringify({
      id: 'evt_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          payment_intent: 'pi_1',
          amount_total: 3000,
          metadata: { booking_id: 'book-1' },
        },
      },
    });
    const firstCall = await useCase.execute(payload1, `valid_sig_${SECRET}`);
    expect(firstCall).toEqual(
      ok({
        status: 'CONFIRMED_AND_NOTIFIED',
        bookingId: 'book-1',
        refundId: null,
      }),
    );
    expect(emailsSent).toBe(1);
    const duplicateCall = await useCase.execute(
      payload1,
      `valid_sig_${SECRET}`,
    );
    expect(duplicateCall).toEqual(
      ok({ status: 'ALREADY_PROCESSED', bookingId: 'book-1', refundId: null }),
    );
    expect(emailsSent).toBe(1);
    simulateCollision = true;
    const payloadCollision = JSON.stringify({
      id: 'evt_002_collision',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_2',
          payment_intent: 'pi_collision_99',
          amount_total: 3000,
          metadata: { booking_id: 'book-late-2' },
        },
      },
    });
    const collisionCall = await useCase.execute(
      payloadCollision,
      `valid_sig_${SECRET}`,
    );
    expect(collisionCall).toEqual(
      ok({
        status: 'COLLISION_AUTO_REFUNDED',
        bookingId: 'book-late-2',
        refundId: 're_auto_refund_001',
      }),
    );
    expect(refundsCreated).toHaveLength(1);
  });
});
