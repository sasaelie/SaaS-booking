import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { bookings, sessions } from '../schema';
import type { Executor } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { BookingFilter } from '../../../core/ports/portal-inputs';
import { getOrganization } from './organizations';
import { SAAS } from '../../../config/constants';
import { ok } from '../../../lib/result';
const bookingColumns = {
  id: bookings.id,
  activityName: bookings.activityName,
  sessionId: bookings.sessionId,
  firstName: bookings.firstName,
  lastName: bookings.lastName,
  email: bookings.email,
  phone: bookings.phone,
  status: bookings.status,
  startsAt: sessions.startsAt,
  endsAt: sessions.endsAt,
  amountPaidCents: bookings.amountPaidCents,
  unitPriceCents: bookings.unitPriceCents,
  currency: bookings.currency,
  paymentMode: bookings.paymentMode,
  hasProof: sql<boolean>`${bookings.proofStorageKey} IS NOT NULL`,
  refundStatus: bookings.refundStatus,
  refundDeadline: bookings.refundDeadline,
  lockedUntil: bookings.lockedUntil,
};
export async function portalBookings(
  db: Executor,
  actor: PortalActor,
  id: string,
  filter: BookingFilter,
) {
  const organization = await getOrganization(db, actor, id);
  if (!organization.ok) return organization;
  const query = bookingFilter(id, filter);
  const list = await db
    .select(bookingColumns)
    .from(bookings)
    .innerJoin(
      sessions,
      and(
        eq(sessions.id, bookings.sessionId),
        eq(sessions.organizationId, bookings.organizationId),
      ),
    )
    .where(query)
    .orderBy(desc(bookings.createdAt))
    .limit(SAAS.PAGE_SIZE)
    .offset((filter.page - 1) * SAAS.PAGE_SIZE);
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(bookings)
    .where(query);
  return ok({ bookings: list, total: count?.total ?? 0, page: filter.page });
}

function bookingFilter(id: string, filter: BookingFilter) {
  return and(
    eq(bookings.organizationId, id),
    filter.status
      ? eq(bookings.status, filter.status as typeof bookings.$inferSelect.status)
      : undefined,
    filter.search
      ? or(
          ilike(bookings.email, `%${filter.search}%`),
          ilike(bookings.firstName, `%${filter.search}%`),
          ilike(bookings.lastName, `%${filter.search}%`),
        )
      : undefined,
  );
}
