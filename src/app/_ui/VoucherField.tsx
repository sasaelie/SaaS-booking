'use client';
import { FORM_LABELS, INPUT_LIMITS } from '../../config/constants';
import { formatMoney } from './format-money';
import { useVoucherQuote } from './use-voucher-quote';
interface Props {
  readonly organizationId: string;
  readonly activityId: string;
  readonly currency: string;
}
export function VoucherField(props: Props) {
  const quote = useVoucherQuote(props);
  return (
    <section>
      <label>
        {FORM_LABELS.VOUCHER}
        <input
          className="ice-slot-pebble"
          name="voucherCode"
          value={quote.code}
          maxLength={INPUT_LIMITS.KEY_MAX}
          onChange={(event) => quote.change(event.target.value)}
          onBlur={quote.verify}
        />
      </label>
      <button type="button" className="liquid-ice-button" onClick={quote.verify}>
        Vérifier le code
      </button>
      <p role="status">
        {quote.message}
        {quote.remaining !== null ? ` : ${formatMoney(quote.remaining, props.currency)}` : ''}
      </p>
    </section>
  );
}
