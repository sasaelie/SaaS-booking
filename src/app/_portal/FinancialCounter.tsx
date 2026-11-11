import { PLAN_UI, COMMERCIAL } from '../../config/commercial';
import type { FinancialSummary } from '../../core/ports/financial.port';
import { formatMoney } from '../_ui/format-money';
export function FinancialCounter({ summary }: { readonly summary: FinancialSummary }) {
  return (
    <section className="portal-panel">
      <h2>{PLAN_UI.SAVINGS}</h2>
      <dl className="commercial-counter">
        <div>
          <dt>{PLAN_UI.GROSS}</dt>
          <dd>{formatMoney(summary.commissionCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>{PLAN_UI.STRIPE}</dt>
          <dd>{formatMoney(summary.stripeFeeCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>{PLAN_UI.AVOIDABLE}</dt>
          <dd>{formatMoney(summary.avoidableCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>{PLAN_UI.PENDING}</dt>
          <dd>{summary.pendingCount}</dd>
        </div>
      </dl>
      <p className="portal-muted">{PLAN_UI.COUNTER_NOTE}</p>
      {summary.avoidableCents > COMMERCIAL.MONTHLY_CENTS ? (
        <p className="portal-notice">
          La part évitable dépasse le prix mensuel de Studio Pro sur cette période.
        </p>
      ) : null}
    </section>
  );
}
