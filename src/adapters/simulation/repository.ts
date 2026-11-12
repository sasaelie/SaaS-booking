import { and, eq, desc, sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../db/client';
import { bookings, sessions, organizations } from '../db/schema';
import { atomic } from '../db/transaction';
import { signSelfCancelToken } from '../../core/domain/self-service-token';
import type { SimulationRepositoryPort, SimulationBooking } from '../../core/ports/simulation.port';
import { ok } from '../../lib/result';
import { required } from '../db/transaction';
import { ERROR_CODES, TIME, TOKEN_RULES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { simulationPayment } from './operations';
import { deleteSimulation } from './delete';
export class SimulationRepository implements SimulationRepositoryPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly organizationId: string,
    private readonly secret: string,
  ) {}
  payment(id: string, success: boolean) {
    return simulationPayment(this.db, this.organizationId, id, success);
  }
  delete(id: string) {
    return deleteSimulation(this.db, this.organizationId, id);
  }
  list() {
    return atomic(this.db, 'Simulation', async (tx) => {
      const list = await tx
        .select({
          booking: bookings,
          timezone: organizations.timezone,
          vouchers: sql<
            SimulationBooking['vouchers']
          >`coalesce((SELECT jsonb_agg(jsonb_build_object('code',code,'amountCents',initial_value_cents,'expiresAt',expires_at,'status',status)) FROM reschedule_vouchers WHERE origin_booking_id=${bookings.id} AND organization_id=${bookings.organizationId}),'[]'::jsonb)`,
          startsAt: sessions.startsAt,
          failure: sql<boolean>`coalesce((SELECT failure FROM simulation_attempts WHERE booking_id=${bookings.id}),false)`,
        })
        .from(bookings)
        .innerJoin(sessions, eq(sessions.id, bookings.sessionId))
        .innerJoin(organizations, eq(organizations.id, bookings.organizationId))
        .where(
          and(
            eq(bookings.organizationId, this.organizationId),
            sql`NOT EXISTS(SELECT 1 FROM simulation_attempts WHERE booking_id=${bookings.id} AND deleted_at IS NOT NULL)`,
          ),
        )
        .orderBy(desc(bookings.createdAt));
      return ok(await Promise.all(list.map((row) => simulationBooking(row, this.organizationId, this.secret))));
    });
  }
  visible(id: string) {
    return atomic(this.db, 'Simulation', async (tx) => {
      const [b] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.id, id),
            eq(bookings.organizationId, this.organizationId),
            sql`NOT EXISTS(SELECT 1 FROM simulation_attempts WHERE booking_id=${bookings.id} AND deleted_at IS NOT NULL)`,
          ),
        );
      return b ? ok(undefined) : failure(ERROR_CODES.NOT_FOUND, 'Simulation', 'booking');
    });
  }
}

type SimulationRow = {
  booking: typeof bookings.$inferSelect;
  startsAt: Date;
  timezone: string;
  failure: boolean;
  vouchers: SimulationBooking['vouchers'];
};
async function simulationBooking(
  { booking: b, startsAt, failure: failed, vouchers, timezone }: SimulationRow,
  organizationId: string,
  secret: string,
) {
  const token = required(
    await signSelfCancelToken(
      {
        organizationId,
        bookingId: b.id,
        version: b.selfServiceVersion,
        expUnixSeconds: Math.floor((Date.now() + TOKEN_RULES.DURATION_DAYS * TIME.DAY_MS) / TIME.SECOND_MS),
      },
      secret,
    ),
  );
  return {
    id: b.id,
    activityId: b.activityId,
    activityName: b.activityName,
    name: b.firstName + ' ' + b.lastName,
    email: b.email,
    startsAt: startsAt.toISOString(),
    timezone,
    status: b.status,
    amountCents: b.amountPaidCents,
    priceCents: b.unitPriceCents - b.voucherDiscountCents,
    currency: b.currency,
    paymentMode: b.paymentMode,
    failure: failed,
    terms: b.termsText,
    managementToken: token,
    vouchers,
  };
}
