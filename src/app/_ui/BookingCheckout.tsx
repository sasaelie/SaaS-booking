import { BOOKING_UI } from '../../config/constants';
import type { BookingFlowState } from './use-booking-flow';
import { formatMoney } from './format-money';
import { bookingPricing } from './booking-pricing';
import { IceIcon } from './IceIcon';
export function BookingCheckout({ flow }: { readonly flow: BookingFlowState }) {
  const price = bookingPricing(flow);
  const disabled =
    flow.form.pending ||
    !flow.form.selectedIso ||
    flow.quote.pending ||
    Boolean(flow.quote.code.trim() && flow.quote.remaining === null);
  return (
    <div className="ice-checkout">
      {price.discount > 0 ? (
        <div className="ice-discount">
          <span>{BOOKING_UI.DISCOUNT}</span>
          <span>−{formatMoney(price.discount, flow.data.currency)}</span>
        </div>
      ) : null}
      <div className="ice-total" aria-live="polite">
        <span>{price.totalLabel}</span>
        <strong>{formatMoney(price.amount, flow.data.currency)}</strong>
      </div>
      <button
        type="submit"
        className="liquid-ice-button ice-primary ice-submit"
        disabled={disabled}
      >
        {price.label}
        <IceIcon name="arrow" />
      </button>
      <p className="ice-payment-note">
        <IceIcon name="lock" />
        {price.note}
      </p>
    </div>
  );
}
