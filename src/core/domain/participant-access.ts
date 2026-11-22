import { BOOKING_STATUSES, VOUCHER_STATUSES, type BookingStatus } from '../../config/constants';
import { COMMERCIAL } from '../../config/commercial';
import { TIME } from '../../config/constants';
export function canKeepParticipantAccess(
  endsAt: Date,
  vouchers: readonly { readonly status: string; readonly expiresAt?: Date }[],
  now: Date,
  unresolved = false,
  closedAt = endsAt,
): boolean {
  if (endsAt > now) return true;
  const outstanding = vouchers.some(
    (v) =>
      (v.status === VOUCHER_STATUSES.ACTIVE ||
        v.status === VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT) &&
      (!v.expiresAt || v.expiresAt > now),
  );
  return (
    unresolved ||
    outstanding ||
    now.getTime() < closedAt.getTime() + COMMERCIAL.OPERATIONAL_RETENTION_DAYS * TIME.DAY_MS
  );
}
export function isAdmissionValid(
  status: BookingStatus,
  cancelled: boolean,
  endsAt: Date,
  now: Date,
) {
  return status === BOOKING_STATUSES.CONFIRMED && !cancelled && endsAt > now;
}
