import { RECORDED_PAYMENT } from '../../config/recorded-payment';
import { INPUT_LIMITS } from '../../config/constants';
import type { PortalBooking } from '../../core/ports/portal-models';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
import { formatMoney } from '../../lib/format-money';
export function RecordOfflinePayment({
  booking,
  organizationId,
}: {
  readonly booking: PortalBooking;
  readonly organizationId: string;
}) {
  const due =
    booking.unitPriceCents - (booking.voucherDiscountCents ?? 0) - booking.amountPaidCents;
  if (booking.paymentMode !== 'NONE' || booking.status !== 'CONFIRMED' || due <= 0) return null;
  return (
    <details className="portal-booking-section">
      <summary>
        {RECORDED_PAYMENT.TITLE} · {formatMoney(due, booking.currency)}
      </summary>
      <PortalForm
        action="record-offline-payment"
        organizationId={organizationId}
        submitLabel={RECORDED_PAYMENT.RECORD}
        compact
      >
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="amountCents" value={due} />
        <PaymentMethod />
        <PortalField
          name="reference"
          label={RECORDED_PAYMENT.REFERENCE}
          required
          maxLength={INPUT_LIMITS.KEY_MAX}
        />
        <label className="portal-check">
          <input type="checkbox" name="confirmed" required />
          {RECORDED_PAYMENT.CONFIRM}
        </label>
      </PortalForm>
    </details>
  );
}
function PaymentMethod() {
  return (
    <label className="portal-field">
      <span>{RECORDED_PAYMENT.METHOD}</span>
      <select name="method">
        {RECORDED_PAYMENT.METHODS.map((method) => (
          <option key={method} value={method}>
            {RECORDED_PAYMENT.LABELS[method]}
          </option>
        ))}
      </select>
    </label>
  );
}
