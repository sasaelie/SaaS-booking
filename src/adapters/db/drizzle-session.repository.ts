// src/adapters/db/drizzle-session.repository.ts
import { eq, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { ERROR_CODES } from '../../config/constants';
import { calculateSeatAvailability } from '../../core/domain/seat-calculator';
import type {
  PersistedSession,
  SessionBookingSnapshot,
} from '../../core/domain/session-types';
import type {
  AtomicSeatReservationInput,
  AtomicSeatReservationOutput,
  SessionRepositoryPort,
} from '../../core/ports/session-repository.port';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
import { bookings, sessions } from './schema';
export type DrizzlePgDb = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;
function mapRowToPersistedSession(
  row: typeof sessions.$inferSelect,
): PersistedSession {
  return {
    id: row.id,
    activityId: row.activityId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    capacity: row.capacity,
    isManual: row.isManual,
    isCancelled: row.isCancelled,
  };
}
function mapRowToBookingSnapshot(
  row: typeof bookings.$inferSelect,
): SessionBookingSnapshot {
  return {
    id: row.id,
    sessionId: row.sessionId,
    status: row.status,
    lockedUntil: row.lockedUntil,
  };
}
export class DrizzleSessionRepository implements SessionRepositoryPort {
  public constructor(private readonly db: DrizzlePgDb) {}
  public async reserveSeatAtomically(
    input: AtomicSeatReservationInput,
  ): Promise<Result<AtomicSeatReservationOutput, AppError>> {
    try {
      return await this.db.transaction(async (tx) => {
        // 1. Création à la volée (Lazy Instantiation) atomique sans doublon
        await tx
          .insert(sessions)
          .values({
            organizationId: input.organizationId,
            activityId: input.activityId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            capacity: input.defaultCapacity,
            isManual: false,
            isCancelled: false,
          })
          .onConflictDoUpdate({
            target: [sessions.activityId, sessions.startsAt],
            set: { activityId: sql`${sessions.activityId}` },
          });
        // 2. Verrouillage pessimiste exclusif (SELECT ... FOR UPDATE)
        const lockedRows = await tx
          .select()
          .from(sessions)
          .where(
            sql`${sessions.activityId} = ${input.activityId} AND ${sessions.startsAt} = ${input.startsAt.toISOString()}`,
          )
          .for('update');
        const lockedRow = lockedRows[0];
        if (!lockedRow) {
          return failAndLog({
            code: ERROR_CODES.INTERNAL_ERROR,
            module: 'DrizzleSessionRepository',
            fn: 'reserveSeatAtomically',
            cause: 'Séance introuvable après Upsert',
            received: 'undefined',
            expected: 'ligne session verrouillée',
          });
        }
        if (lockedRow.isCancelled) {
          return failAndLog({
            code: ERROR_CODES.SESSION_CLOSED_OR_PAUSED,
            module: 'DrizzleSessionRepository',
            fn: 'reserveSeatAtomically',
            cause: 'Tentative de réservation sur une séance annulée',
            received: lockedRow.id,
            expected: 'isCancelled = false',
          });
        }
        // 3. Lecture des réservations sous verrou et calcul de disponibilité
        const existingRows = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.sessionId, lockedRow.id));
        const snapshots = existingRows.map(mapRowToBookingSnapshot);
        const availabilityBefore = calculateSeatAvailability(
          lockedRow.capacity,
          snapshots,
          input.now,
        );
        if (!availabilityBefore.ok) return availabilityBefore;
        if (!availabilityBefore.value.isBookable) {
          return failAndLog({
            code: ERROR_CODES.SESSION_FULL,
            module: 'DrizzleSessionRepository',
            fn: 'reserveSeatAtomically',
            cause: 'Aucune place restante sous verrou SQL',
            received: availabilityBefore.value.displayLabel,
            expected: 'au moins 1 place disponible',
          });
        }
        // 4. Insertion de la réservation (1 place)
        const insertedBookings = await tx
          .insert(bookings)
          .values({
            organizationId: input.organizationId,
            activityId: input.activityId,
            sessionId: lockedRow.id,
            idempotencyKey: input.booking.idempotencyKey,
            status: input.booking.status,
            firstName: input.booking.firstName,
            lastName: input.booking.lastName,
            email: input.booking.email,
            phone: input.booking.phone,
            marketingOptIn: input.booking.marketingOptIn,
            unitPriceCents: input.booking.unitPriceCents,
            voucherDiscountCents: input.booking.voucherDiscountCents,
            amountPaidCents: input.booking.amountPaidCents,
            appliedVoucherId: input.booking.appliedVoucherId,
            lockedUntil: input.booking.lockedUntil,
            termsAcceptedAt: input.booking.termsAcceptedAt,
            termsVersionHash: input.booking.termsVersionHash,
          })
          .returning({ id: bookings.id });
        const inserted = insertedBookings[0];
        if (!inserted) {
          return failAndLog({
            code: ERROR_CODES.INTERNAL_ERROR,
            module: 'DrizzleSessionRepository',
            fn: 'reserveSeatAtomically',
            cause: 'Échec insertion booking',
            received: '0 row returned',
            expected: 'booking.id',
          });
        }
        const availabilityAfter = calculateSeatAvailability(
          lockedRow.capacity,
          [
            ...snapshots,
            {
              id: inserted.id,
              sessionId: lockedRow.id,
              status: input.booking.status,
              lockedUntil: input.booking.lockedUntil,
            },
          ],
          input.now,
        );
        if (!availabilityAfter.ok) return availabilityAfter;
        return ok({
          bookingId: inserted.id,
          session: mapRowToPersistedSession(lockedRow),
          availabilityAfterBooking: availabilityAfter.value,
        });
      });
    } catch (rawError: unknown) {
      return failAndLog({
        code: ERROR_CODES.INTERNAL_ERROR,
        module: 'DrizzleSessionRepository',
        fn: 'reserveSeatAtomically',
        cause: 'Exception transaction PostgreSQL',
        received:
          rawError instanceof Error ? rawError.message : String(rawError),
        expected: 'transaction atomique réussie',
      });
    }
  }
}
