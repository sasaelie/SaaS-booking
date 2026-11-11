import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI, AUDIENCE_LABELS, PAYMENT_LABELS, MONEY } from '../../../config/constants';
import { PortalField } from '../PortalField';
import { PortalSelect } from '../PortalSelect';
export function ActivityPricingFields({
  initial,
  pro = true,
}: {
  readonly initial?: PortalActivity;
  readonly pro?: boolean;
}) {
  return (
    <div className="portal-form-grid">
      <PortalField
        label={ACTIVITY_UI.PRICE}
        name="price"
        type="text"
        inputMode="decimal"
        required
        defaultValue={
          initial
            ? (initial.priceCents / MONEY.CENTS_PER_UNIT).toFixed(MONEY.DECIMAL_PLACES)
            : undefined
        }
      />
      <PortalSelect
        label={ACTIVITY_UI.AUDIENCE}
        name="audiencePolicy"
        defaultValue={initial?.audiencePolicy ?? 'ALL_PUBLIC'}
      >
        {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </PortalSelect>
      <PaymentChoice initial={initial} pro={pro} />
    </div>
  );
}

function PaymentChoice({
  initial,
  pro,
}: {
  readonly initial?: PortalActivity;
  readonly pro: boolean;
}) {
  return (
    <PortalSelect
      label={ACTIVITY_UI.PAYMENT}
      name="paymentMode"
      defaultValue={initial?.paymentMode ?? (pro ? 'NONE' : 'STRIPE')}
    >
      {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
        <option key={value} value={value} disabled={!pro && value === 'BANK_TRANSFER'}>
          {!pro && value === 'NONE' ? 'Activité gratuite' : label}
          {!pro && value === 'BANK_TRANSFER' ? ' — Studio Pro' : ''}
        </option>
      ))}
    </PortalSelect>
  );
}
