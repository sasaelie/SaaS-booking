import { useEffect, useId, useRef } from 'react';
import { BOOKING_UI } from '../../config/constants';
import type { useVoucherQuote } from './use-voucher-quote';
import { IceIcon } from './IceIcon';
import { VoucherInput } from './VoucherInput';
export function VoucherField({ quote }: { readonly quote: ReturnType<typeof useVoucherQuote> }) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (quote.code && details.current) details.current.open = true;
  }, [quote.code]);
  return (
    <details ref={details} className="ice-voucher">
      <summary>
        <IceIcon name="ticket" />
        {BOOKING_UI.VOUCHER_PROMPT}
        <span aria-hidden="true">+</span>
      </summary>
      <VoucherInput quote={quote} id={id} />
      <p id={`${id}-status`} className="ice-hint" role="status">
        {quote.message || (quote.code ? BOOKING_UI.VOUCHER_REVIEW : '')}
      </p>
    </details>
  );
}
