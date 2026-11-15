import { BOOKING_STATUSES, VOUCHER_STATUSES, type BookingStatus } from '../../config/constants';
export function canKeepParticipantAccess(
  endsAt: Date,
  vouchers: readonly { readonly status: string; readonly expiresAt?: Date }[],
  now: Date,
): boolean {
  if (endsAt > now) return true;
  const consumed = vouchers.some(
    (v) =>
      v.status === VOUCHER_STATUSES.USED_FOR_BOOKING ||
      v.status === VOUCHER_STATUSES.USED_FOR_EXTERNAL_BENEFIT,
  );
  const outstanding = vouchers.some(
    (v) =>
      (v.status === VOUCHER_STATUSES.ACTIVE ||
        v.status === VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT) &&
      (!v.expiresAt || v.expiresAt > now),
  );
  return !consumed || outstanding;
}
export function isAdmissionValid(
  status: BookingStatus,
  cancelled: boolean,
  endsAt: Date,
  now: Date,
) {
  return status === BOOKING_STATUSES.CONFIRMED && !cancelled && endsAt > now;
}
