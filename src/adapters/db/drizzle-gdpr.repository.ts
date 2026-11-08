import { accountingArchiveUntil } from '../../core/domain/accounting-retention';
import { lockBookingContext } from './payment/locks';
import { and, eq, lt, inArray, sql } from 'drizzle-orm';
import { bookings } from './schema';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { enqueue } from './jobs/enqueue';
import { ok, type Result } from '../../lib/result';
import { failure, unexpected } from '../../lib/errors';
import { ERROR_CODES, BOOKING_STATUSES, JOB_TYPES } from '../../config/constants';
import type { GdprRepositoryPort, GdprBookingSummary } from '../../core/ports/gdpr.port';
const NON_ACCOUNTING = { phone: null, marketingOptIn: false };
const ANONYMIZED = {
  ...NON_ACCOUNTING,
  firstName: '[anonymous]',
  lastName: '[anonymous]',
  email: 'anonymous@invalid.local',
  selfServiceVersion: sql`${bookings.selfServiceVersion}+1`,
  anonymizedAt: sql`now()`,
};
export class DrizzleGdprRepository implements GdprRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  anonymizeUnpaidBookingsOlderThanAtomically(
    cutoffDate: Date,
  ): Promise<Result<{ readonly anonymizedCount: number }>> {
    return atomic(this.db, 'Retention', async (tx) => {
      const candidates = await tx
        .select()
        .from(bookings)
        .where(
          and(
            lt(bookings.createdAt, cutoffDate),
            eq(bookings.amountPaidCents, 0),
            inArray(bookings.status, [
              BOOKING_STATUSES.EXPIRED,
              BOOKING_STATUSES.CANCELLED_BY_ATTENDEE,
              BOOKING_STATUSES.CANCELLED_BY_ORGANIZER,
              BOOKING_STATUSES.PENDING_PAYMENT,
            ]),
          ),
        )
        .for('update');
      for (const booking of candidates) {
        if (booking.anonymizedAt) continue;
        await tx.update(bookings).set(ANONYMIZED).where(eq(bookings.id, booking.id));
        if (booking.proofStorageKey)
          await enqueue(
            tx,
            booking.organizationId,
            JOB_TYPES.PURGE,
            `purge:${booking.proofStorageKey}`,
            { bookingId: booking.id, storageKey: booking.proofStorageKey },
          );
      }
      return ok({
        anonymizedCount: candidates.filter((row) => !row.anonymizedAt).length,
      });
    });
  }
  async getBookingForPrivacyRequest(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<GdprBookingSummary>> {
    try {
      const [booking] = await this.db
        .select()
        .from(bookings)
        .where(and(eq(bookings.organizationId, organizationId), eq(bookings.id, bookingId)));
      return booking
        ? ok({
            bookingId: booking.id,
            organizationId,
            amountPaidCents: booking.amountPaidCents,
            createdAt: booking.createdAt,
            paidAt: booking.paidAt,
          })
        : failure(ERROR_CODES.NOT_FOUND, 'Retention', 'read');
    } catch {
      return unexpected('Retention', 'read');
    }
  }
  scrubNonAccountingDataAtomically(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<void>> {
    return this.update(organizationId, bookingId, false);
  }
  fullyAnonymizeBookingAtomically(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<void>> {
    return this.update(organizationId, bookingId, true);
  }
  private update(organizationId: string, bookingId: string, full: boolean): Promise<Result<void>> {
    return atomic(this.db, 'Retention', async (tx) => {
      const context = await lockBookingContext(tx, organizationId, bookingId);
      const booking = context?.booking;
      if (!booking) return failure(ERROR_CODES.NOT_FOUND, 'Retention', 'update');
      if (
        full &&
        booking.amountPaidCents > 0 &&
        new Date() < accountingArchiveUntil(booking.paidAt, booking.createdAt)
      )
        return failure(ERROR_CODES.CONFLICT, 'Retention', 'paidDuringErasure');
      await tx
        .update(bookings)
        .set(
          full
            ? ANONYMIZED
            : {
                ...NON_ACCOUNTING,
                email: 'anonymous@invalid.local',
                selfServiceVersion: sql`${bookings.selfServiceVersion}+1`,
              },
        )
        .where(eq(bookings.id, booking.id));
      if (booking.proofStorageKey)
        await enqueue(tx, organizationId, JOB_TYPES.PURGE, `purge:${booking.proofStorageKey}`, {
          bookingId,
          storageKey: booking.proofStorageKey,
        });
      return ok(undefined);
    });
  }
}
