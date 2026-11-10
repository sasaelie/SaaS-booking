import { bookingStatusFilter } from './booking-status-filter';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { bookings, sessions } from '../schema';
import type { Executor } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { BookingFilter } from '../../../core/ports/portal-inputs';
import { getOrganization } from './organizations';
import { SAAS } from '../../../config/constants';
import { ok } from '../../../lib/result';
import { canIssueManualVoucher } from '../../../core/domain/manual-voucher-eligibility';
const bookingColumns = {
  confirmedAt: bookings.confirmedAt,
  anonymizedAt: bookings.anonymizedAt,
  appliedVoucherId: bookings.appliedVoucherId,
  sourceStatus: sql<
    string | null
  >`(SELECT v.status FROM reschedule_vouchers v WHERE v.id=${bookings.appliedVoucherId} AND v.organization_id=${bookings.organizationId})`,
  id: bookings.id,
  vouchers: sql<
    NonNullable<import('../../../core/ports/portal-models').PortalBooking['vouchers']>
  >`COALESCE((SELECT jsonb_agg(jsonb_build_object('kind',v.kind,'code',v.code,'initialValueCents',v.initial_value_cents,'currency',v.currency,'status',v.status,'expiresAt',v.expires_at)) FROM reschedule_vouchers v WHERE v.origin_booking_id=${bookings.id} AND v.organization_id=${bookings.organizationId}),'[]'::jsonb)`,
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
  voucherDiscountCents: bookings.voucherDiscountCents,
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
  const list = await bookingList(db, query, filter);
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(bookings)
    .where(query);
  return ok({ bookings: list.map(toPortalBooking), total: count?.total ?? 0, page: filter.page });
}

function bookingList(db: Executor, query: ReturnType<typeof bookingFilter>, filter: BookingFilter) {
  return db
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
}

function toPortalBooking(row: Awaited<ReturnType<typeof bookingList>>[number]) {
  const { confirmedAt, anonymizedAt, appliedVoucherId, sourceStatus, ...booking } = row;
  const canIssueVoucher =
    canIssueManualVoucher(
      { ...booking, confirmedAt, anonymizedAt, appliedVoucherId },
      sourceStatus,
    ) && !booking.vouchers.some((voucher) => voucher.kind === 'CANCELLATION');
  return { ...booking, canIssueVoucher };
}

function bookingFilter(id: string, filter: BookingFilter) {
  return and(
    eq(bookings.organizationId, id),
    filter.activityId ? eq(bookings.activityId, filter.activityId) : undefined,
    bookingStatusFilter(filter.status),
    filter.search
      ? or(
          ilike(bookings.email, `%${filter.search}%`),
          ilike(bookings.firstName, `%${filter.search}%`),
          ilike(bookings.lastName, `%${filter.search}%`),
        )
      : undefined,
  );
}
