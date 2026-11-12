import { COMMERCIAL } from '../../config/commercial';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
import { formatMoney } from '../_ui/format-money';
export function BillingPeriods() {
  return (
    <fieldset className="commercial-periods">
      <legend>{UI.BILLING_INTERVAL}</legend>
      <Period
        interval="month"
        title={UI.MONTHLY}
        price={COMMERCIAL.MONTHLY_CENTS}
        note={UI.MONTHLY_NOTE}
      />
      <Period
        interval="year"
        title={UI.ANNUAL}
        price={COMMERCIAL.ANNUAL_CENTS}
        note={UI.ANNUAL_NOTE}
      />
    </fieldset>
  );
}
function Period({
  interval,
  title,
  price,
  note,
}: {
  readonly interval: 'month' | 'year';
  readonly title: string;
  readonly price: number;
  readonly note: string;
}) {
  return (
    <label className="commercial-period">
      <input
        type="radio"
        name="interval"
        value={interval}
        defaultChecked={interval === 'month'}
        required
      />
      <span>
        <strong>
          {title} · {formatMoney(price, 'EUR')}
        </strong>
        <small>{note}</small>
      </span>
    </label>
  );
}
