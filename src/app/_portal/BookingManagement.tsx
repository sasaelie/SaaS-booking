import { ManualVoucherForm } from './ManualVoucherForm';
import { RecordBankRefund } from './RecordBankRefund';
import type { PortalBooking } from '../../core/ports/portal-models';
import { PORTAL, BOOKING_STATUSES, PAYMENT_MODES } from '../../config/constants';
import { AdminOperation } from './AdminOperation';
import { portalDate } from './date-label';
interface Props {
  readonly booking: PortalBooking;
  readonly organizationId: string;
  readonly timezone: string;
}
export function BookingManagement({ booking, organizationId, timezone }: Props) {
  const base = { organizationId, bookingId: booking.id };
  return (
    <div className="portal-action-grid">
      <ManualVoucherForm booking={booking} organizationId={organizationId} timezone={timezone} />
      {booking.paymentMode === PAYMENT_MODES.BANK_TRANSFER &&
      booking.status === BOOKING_STATUSES.PROOF_SUBMITTED ? (
        <BankReview base={base} hasProof={booking.hasProof} />
      ) : null}
      {booking.status === BOOKING_STATUSES.CONFIRMED ? (
        <section className="portal-panel">
          <h3>{PORTAL.CANCEL_ATTENDEE}</h3>
          <AdminOperation
            command={{ ...base, action: 'cancel', adminOverride: false }}
            label={PORTAL.CANCEL_ATTENDEE}
            voucherOverride
          />
        </section>
      ) : null}
      {booking.refundStatus === 'MANUAL_PENDING' ? (
        <aside className="portal-notice">
          <strong>{PORTAL.MANUAL_REFUND}</strong>
          {booking.refundDeadline ? (
            <p>
              {PORTAL.REFUND_DEADLINE} : {portalDate(booking.refundDeadline, timezone)}
            </p>
          ) : null}
          <RecordBankRefund organizationId={organizationId} bookingId={booking.id} />
        </aside>
      ) : null}
    </div>
  );
}

function BankReview({
  base,
  hasProof,
}: {
  readonly base: { organizationId: string; bookingId: string };
  readonly hasProof: boolean;
}) {
  return (
    <section className="portal-panel">
      <h3>{PORTAL.BANK_REVIEW}</h3>
      {hasProof ? (
        <AdminOperation command={{ ...base, action: 'view-proof' }} label={PORTAL.VIEW_PROOF} />
      ) : null}
      <AdminOperation
        command={{ ...base, action: 'review-bank', decision: 'APPROVE' }}
        label={PORTAL.APPROVE}
      />
      <AdminOperation
        command={{ ...base, action: 'review-bank', decision: 'REJECT' }}
        label={PORTAL.REJECT}
      />
    </section>
  );
}
