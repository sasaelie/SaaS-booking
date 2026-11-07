// src/core/domain/__tests__/milestone1-concurrency.test.ts
import { describe, expect, it } from 'vitest';
import { BOOKING_STATUSES, ERROR_CODES } from '../../../config/constants';
import { failAndLog } from '../../../lib/logger';
import { ok, type AppError, type Result } from '../../../lib/result';
import type {
  AtomicSeatReservationInput,
  AtomicSeatReservationOutput,
  SessionRepositoryPort,
} from '../../ports/session-repository.port';
import { calculateSeatAvailability } from '../seat-calculator';
import type {
  PersistedSession,
  SessionBookingSnapshot,
} from '../session-types';
/** Simulateur du verrou exclusif utilisant une file d’attente mutex. */
class SerializedMutexSessionRepository implements SessionRepositoryPort {
  private mutexQueue: Promise<unknown> = Promise.resolve();
  public readonly sessionsByKey = new Map<string, PersistedSession>();
  public readonly bookingsBySession = new Map<
    string,
    SessionBookingSnapshot[]
  >();
  public reserveSeatAtomically(
    input: AtomicSeatReservationInput,
  ): Promise<Result<AtomicSeatReservationOutput, AppError>> {
    const nextTask = this.mutexQueue.then(() =>
      this.executeLockedTransaction(input),
    );
    this.mutexQueue = nextTask.catch(() => undefined);
    return nextTask;
  }
  private async executeLockedTransaction(
    input: AtomicSeatReservationInput,
  ): Promise<Result<AtomicSeatReservationOutput, AppError>> {
    await new Promise((resolve) => setTimeout(resolve, 2));
    const uniqueKey = `${input.activityId}::${input.startsAt.toISOString()}`;
    let session = this.sessionsByKey.get(uniqueKey);
    if (!session) {
      session = {
        id: `sess-${this.sessionsByKey.size + 1}`,
        activityId: input.activityId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        capacity: input.defaultCapacity,
        isManual: false,
        isCancelled: false,
      };
      this.sessionsByKey.set(uniqueKey, session);
    }
    const currentBookings = this.bookingsBySession.get(session.id) ?? [];
    const availabilityBefore = calculateSeatAvailability(
      session.capacity,
      currentBookings,
      input.now,
    );
    if (!availabilityBefore.ok) return availabilityBefore;
    if (!availabilityBefore.value.isBookable) {
      return failAndLog({
        code: ERROR_CODES.SESSION_FULL,
        module: 'SerializedMutexSessionRepository',
        fn: 'executeLockedTransaction',
        cause: 'Séance complète sous verrou',
        received: availabilityBefore.value.displayLabel,
        expected: 'au moins 1 place disponible',
      });
    }
    const newBooking: SessionBookingSnapshot = {
      id: `book-${currentBookings.length + 1}`,
      sessionId: session.id,
      status: input.booking.status,
      lockedUntil: input.booking.lockedUntil,
    };
    const updatedBookings = [...currentBookings, newBooking];
    this.bookingsBySession.set(session.id, updatedBookings);
    const availabilityAfter = calculateSeatAvailability(
      session.capacity,
      updatedBookings,
      input.now,
    );
    if (!availabilityAfter.ok) return availabilityAfter;
    return ok({
      bookingId: newBooking.id,
      session,
      availabilityAfterBooking: availabilityAfter.value,
    });
  }
}
describe('Jalon 1 — Test de résistance anti-surbooking (10 tirs simultanés sur 5 places)', () => {
  it('accepte exactement 5 réservations, rejette les 5 autres avec SESSION_FULL et ne crée qu’une seule séance', async () => {
    const repo = new SerializedMutexSessionRepository();
    const now = new Date('2026-11-09T10:00:00.000Z');
    const startsAt = new Date('2026-11-14T13:00:00.000Z');
    const endsAt = new Date('2026-11-14T16:00:00.000Z');
    const concurrentRequests = Array.from({ length: 10 }, (_, index) =>
      repo.reserveSeatAtomically({
        organizationId: 'org-studio-360',
        activityId: 'act-couture-adultes',
        startsAt,
        endsAt,
        defaultCapacity: 5,
        now,
        booking: {
          idempotencyKey: `idem-key-${index + 1}`,
          status: BOOKING_STATUSES.PENDING_PAYMENT,
          firstName: `Client`,
          lastName: `#${index + 1}`,
          email: `client${index + 1}@example.com`,
          phone: null,
          marketingOptIn: false,
          unitPriceCents: 3000,
          voucherDiscountCents: 0,
          amountPaidCents: 3000,
          appliedVoucherId: null,
          lockedUntil: new Date('2026-11-09T10:30:00.000Z'),
          termsAcceptedAt: now,
          termsVersionHash: 'sha256-v1',
        },
      }),
    );
    const results = await Promise.all(concurrentRequests);
    const successes = results.filter((r) => r.ok);
    const failures = results.filter((r) => !r.ok);
    expect(repo.sessionsByKey.size).toBe(1);
    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(5);
    for (const failure of failures)
      if (!failure.ok)
        expect(failure.error.code).toBe(ERROR_CODES.SESSION_FULL);
    const lastSuccess = successes[4];
    if (lastSuccess && lastSuccess.ok) {
      expect(lastSuccess.value.availabilityAfterBooking.displayLabel).toBe(
        '0 / 5',
      );
      expect(lastSuccess.value.availabilityAfterBooking.isBookable).toBe(false);
    }
  });
});
