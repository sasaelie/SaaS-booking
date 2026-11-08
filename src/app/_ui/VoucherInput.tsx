import { BOOKING_UI, FORM_LABELS, INPUT_LIMITS } from '../../config/constants';
import type { useVoucherQuote } from './use-voucher-quote';
export function VoucherInput({
  quote,
  id,
}: {
  readonly quote: ReturnType<typeof useVoucherQuote>;
  readonly id: string;
}) {
  return (
    <div className="ice-voucher-input">
      <label htmlFor={id} className="ice-sr-only">
        {FORM_LABELS.VOUCHER}
      </label>
      <input
        id={id}
        className="ice-slot-pebble"
        name="voucherCode"
        value={quote.code}
        maxLength={INPUT_LIMITS.KEY_MAX}
        onChange={(event) => quote.change(event.target.value)}
        onBlur={quote.verify}
        aria-describedby={`${id}-status`}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="liquid-ice-button"
        onClick={quote.verify}
        disabled={quote.pending || !quote.code.trim()}
      >
        {quote.pending ? BOOKING_UI.VERIFYING : BOOKING_UI.VERIFY}
      </button>
    </div>
  );
}
