import { ManualVoucherForm } from './ManualVoucherForm';
import { RecordBankRefund } from './RecordBankRefund';
import type { PortalBooking } from '../../core/ports/portal-models';
import { PORTAL, BOOKING_STATUSES, PAYMENT_MODES } from '../../config/constants';
import { AdminOperation } from './AdminOperation';
import { portalDate } from './date-label';
import { ParticipantRecovery } from './ParticipantRecovery';
import { RecordOfflinePayment } from './RecordOfflinePayment';
import { PortalField } from './PortalField';
import { RECORDED_PAYMENT } from '../../config/recorded-payment';
interface Props {
  readonly booking: PortalBooking;
  readonly organizationId: string;
  readonly timezone: string;
}
export function BookingManagement({ booking, organizationId, timezone }: Props) {
  const base = { organizationId, bookingId: booking.id };
  return (
    <div className="portal-booking-actions">
      {['CONFIRMED', 'CANCELLED_BY_ATTENDEE', 'CANCELLED_BY_ORGANIZER'].includes(booking.status) ? (
        <ParticipantRecovery organizationId={organizationId} bookingId={booking.id} />
      ) : null}
      <ManualVoucherForm booking={booking} organizationId={organizationId} timezone={timezone} />
      <RecordOfflinePayment booking={booking} organizationId={organizationId} />
      {booking.paymentMode === PAYMENT_MODES.BANK_TRANSFER &&
      [BOOKING_STATUSES.PROOF_SUBMITTED, BOOKING_STATUSES.PENDING_PAYMENT].some(
        (status) => status === booking.status,
      ) ? (
        <BankReview base={base} hasProof={booking.hasProof} />
      ) : null}
      {booking.status === BOOKING_STATUSES.CONFIRMED ? (
        <section className="portal-booking-section portal-booking-cancellation">
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
    <section className="portal-booking-section portal-review-actions">
      <h3>{PORTAL.BANK_REVIEW}</h3>
      {hasProof ? (
        <AdminOperation command={{ ...base, action: 'view-proof' }} label={PORTAL.VIEW_PROOF} />
      ) : null}
      <AdminOperation
        command={{ ...base, action: 'review-bank', decision: 'APPROVE' }}
        label={PORTAL.APPROVE}
      >
        <PortalField
          name="reference"
          label={RECORDED_PAYMENT.BANK_REFERENCE}
          required={!hasProof}
        />
      </AdminOperation>
      <AdminOperation
        command={{ ...base, action: 'review-bank', decision: 'REJECT' }}
        label={PORTAL.REJECT}
      />
    </section>
  );
}
