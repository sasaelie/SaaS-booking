import { BOOKING_UI } from '../../config/constants';
import type { BookingActionState } from '../actions/booking.actions';
export function BookingBankInstructions({
  bank,
}: {
  readonly bank: NonNullable<NonNullable<BookingActionState['booking']>['bankInstructions']>;
}) {
  return (
    <dl className="ice-bank-instructions">
      <dt>{BOOKING_UI.BANK_IBAN}</dt>
      <dd>{bank.iban}</dd>
      <dt>{BOOKING_UI.BANK_ACCOUNT}</dt>
      <dd>{bank.accountName}</dd>
      <dt>{BOOKING_UI.BANK_REFERENCE}</dt>
      <dd>{bank.reference}</dd>
    </dl>
  );
}
