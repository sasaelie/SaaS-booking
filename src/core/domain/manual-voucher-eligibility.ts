interface CancellationCredit {
  readonly status: string;
  readonly confirmedAt: Date | null;
  readonly refundStatus: string | null;
  readonly anonymizedAt: Date | null;
  readonly amountPaidCents: number;
  readonly voucherDiscountCents: number;
  readonly appliedVoucherId: string | null;
}
export function canIssueManualVoucher(booking: CancellationCredit, sourceStatus: string | null) {
  return (
    booking.status === 'CANCELLED_BY_ATTENDEE' &&
    Boolean(booking.confirmedAt) &&
    !booking.refundStatus &&
    !booking.anonymizedAt &&
    booking.amountPaidCents + booking.voucherDiscountCents > 0 &&
    (!booking.appliedVoucherId || sourceStatus === 'USED_FOR_BOOKING')
  );
}
