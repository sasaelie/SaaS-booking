// src/core/use-cases/handle-stripe-webhook.use-case.ts
import { logger } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
import type { NotificationPort } from '../ports/booking-ports';
import type {
  BookingPaymentRepositoryPort,
  PaymentGatewayPort,
} from '../ports/payment-gateway.port';
export interface HandlePaymentWebhookDeps {
  readonly paymentGateway: PaymentGatewayPort;
  readonly paymentRepo: BookingPaymentRepositoryPort;
  readonly notificationPort: NotificationPort;
  readonly nowProvider?: () => Date;
}
export type WebhookHandlingStatus =
  | 'IGNORED_EVENT_TYPE'
  | 'ALREADY_PROCESSED'
  | 'CONFIRMED_AND_NOTIFIED'
  | 'COLLISION_AUTO_REFUNDED';
export interface HandlePaymentWebhookOutput {
  readonly status: WebhookHandlingStatus;
  readonly bookingId: string | null;
  readonly refundId: string | null;
}
export class HandlePaymentWebhookUseCase {
  public constructor(private readonly deps: HandlePaymentWebhookDeps) {}
  public async execute(
    rawBody: string,
    signatureHeader: string,
  ): Promise<Result<HandlePaymentWebhookOutput, AppError>> {
    const parsedRes = await this.deps.paymentGateway.verifyWebhookAndParse(
      rawBody,
      signatureHeader,
    );
    if (!parsedRes.ok) return parsedRes;
    const event = parsedRes.value;
    if (event === null)
      return ok({
        status: 'IGNORED_EVENT_TYPE',
        bookingId: null,
        refundId: null,
      });
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const atomicRes =
      await this.deps.paymentRepo.confirmPaymentOrDetectCollisionAtomically(
        event,
        now,
      );
    if (!atomicRes.ok) return atomicRes;
    const outcome = atomicRes.value;
    if (outcome.status === 'ALREADY_PROCESSED')
      return ok({
        status: 'ALREADY_PROCESSED',
        bookingId: event.bookingId,
        refundId: null,
      });
    if (outcome.status === 'COLLISION_OVERBOOKED') {
      logger.warn({
        module: 'HandlePaymentWebhookUseCase',
        fn: 'execute',
        cause:
          'Collision sur la dernière place détectée : déclenchement du remboursement automatique',
        received: outcome.bookingId,
        expected: 'place disponible sous verrou SQL',
      });
      const refundRes = await this.deps.paymentGateway.refundPayment({
        paymentReference: event.paymentReference,
        amountCents: event.amountPaidCents,
        reason: 'Auto-refund: last seat taken during payment race condition',
      });
      if (!refundRes.ok) return refundRes;
      return ok({
        status: 'COLLISION_AUTO_REFUNDED',
        bookingId: outcome.bookingId,
        refundId: refundRes.value.refundId,
      });
    }
    await this.deps.notificationPort.sendBookingConfirmation({
      bookingId: outcome.bookingId,
      organizationName: outcome.organizationName,
      activityName: outcome.activityName,
      attendeeFirstName: outcome.attendeeFirstName,
      attendeeEmail: outcome.attendeeEmail,
      startsAt: outcome.startsAt,
      endsAt: outcome.endsAt,
      timezone: outcome.timezone,
      amountPaidCents: outcome.amountPaidCents,
      currency: outcome.currency,
    });
    return ok({
      status: 'CONFIRMED_AND_NOTIFIED',
      bookingId: outcome.bookingId,
      refundId: null,
    });
  }
}
