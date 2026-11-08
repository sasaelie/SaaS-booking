import { and, eq, isNull, sql } from 'drizzle-orm';
import type { SelfBookingRepositoryPort } from '../../core/ports/self-booking.port';
import type { SelfCancelTokenPayload } from '../../core/validation/self-service';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { bookings, organizations, sessions } from './schema';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
const columns = {
  organizationSlug: organizations.slug,
  organizationName: organizations.name,
  activityId: bookings.activityId,
  activityName: bookings.activityName,
  startsAt: sessions.startsAt,
  timezone: organizations.timezone,
  status: bookings.status,
  paymentMode: bookings.paymentMode,
  lockedUntil: bookings.lockedUntil,
  hasProof: sql<boolean>`${bookings.proofStorageKey} IS NOT NULL`,
};
export class DrizzleSelfBookingRepository implements SelfBookingRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  read(payload: SelfCancelTokenPayload) {
    return atomic(this.db, 'SelfBooking', async (tx) => {
      const [row] = await tx
        .select(columns)
        .from(bookings)
        .innerJoin(organizations, eq(organizations.id, bookings.organizationId))
        .innerJoin(
          sessions,
          and(
            eq(sessions.id, bookings.sessionId),
            eq(sessions.organizationId, bookings.organizationId),
          ),
        )
        .where(
          and(
            eq(bookings.id, payload.bookingId),
            eq(bookings.organizationId, payload.organizationId),
            eq(bookings.selfServiceVersion, payload.version),
            isNull(bookings.anonymizedAt),
          ),
        );
      return row ? ok(row) : failure(ERROR_CODES.UNAUTHORIZED, 'SelfBooking', 'read');
    });
  }
}
