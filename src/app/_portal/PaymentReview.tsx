'use client';
import { BILLING_PREVIEW as UI } from '../../config/billing-preview';
import { COMMERCIAL, PLAN_UI, type BillingInterval } from '../../config/commercial';
import { PLAN_SELECTION } from '../../config/plan-selection';
import { ModalFrame } from '../_ui/ModalFrame';
import { formatMoney } from '../_ui/format-money';
export function PaymentReview({
  open,
  interval,
  offered,
  onClose,
}: {
  readonly open: boolean;
  readonly interval: BillingInterval;
  readonly offered: boolean;
  readonly onClose: () => void;
}) {
  const price = interval === 'year' ? COMMERCIAL.ANNUAL_CENTS : COMMERCIAL.MONTHLY_CENTS;
  return (
    <ModalFrame open={open} title={UI.TITLE} onClose={onClose}>
      <dl className="billing-review">
        <div>
          <dt>{UI.PLAN}</dt>
          <dd>{PLAN_UI.PRO}</dd>
        </div>
        <div>
          <dt>{UI.INTERVAL}</dt>
          <dd>{interval === 'year' ? PLAN_SELECTION.ANNUAL : PLAN_SELECTION.MONTHLY}</dd>
        </div>
        <div>
          <dt>{UI.COMMERCIAL_PRICE}</dt>
          <dd>{formatMoney(price, 'EUR')}</dd>
        </div>
        <div className="billing-review-total">
          <dt>{offered ? UI.DUE : UI.TEST_DUE}</dt>
          <dd>{formatMoney(offered ? 0 : price, 'EUR')}</dd>
        </div>
      </dl>
      {offered ? <p className="portal-notice">{UI.OFFERED_DUE}</p> : null}
      <PaymentNextStep onClose={onClose} />
    </ModalFrame>
  );
}
function PaymentNextStep({ onClose }: { readonly onClose: () => void }) {
  return (
    <>
      <h3>{UI.NEXT_TITLE}</h3>
      <p>{UI.NEXT}</p>
      <p className="portal-notice">{UI.BLOCKED}</p>
      <button type="button" className="liquid-ice-button portal-button" onClick={onClose}>
        {UI.CLOSE}
      </button>
    </>
  );
}
