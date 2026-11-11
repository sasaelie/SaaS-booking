import type { PlatformOverview } from '../../core/ports/portal-models';
import { formatMoney } from '../_ui/format-money';
export function PlatformFinance({ data }: { readonly data: PlatformOverview }) {
  const finance = data.financial;
  if (!finance) return null;
  return (
    <section className="portal-panel">
      <h2>Finances de la plateforme</h2>
      <dl className="commercial-counter">
        <div>
          <dt>Abonnements encaissés, brut</dt>
          <dd>{formatMoney(finance.subscriptionCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>Commissions Liberté rapprochées</dt>
          <dd>{formatMoney(finance.commissionGrossCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>Frais Stripe financés par ces commissions</dt>
          <dd>{formatMoney(finance.stripeFeeCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>Commissions après Stripe et coûts saisis, avant exploitation et taxes</dt>
          <dd>{formatMoney(finance.commissionNetCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>Volume de réservations des associations — hors revenus plateforme</dt>
          <dd>{formatMoney(finance.bookingVolumeCents, 'EUR')}</dd>
        </div>
        <div>
          <dt>Paiements en attente de rapprochement</dt>
          <dd>{finance.pendingCount}</dd>
        </div>
      </dl>
      <p className="portal-muted">
        Le volume des associations ne constitue pas le chiffre d’affaires du SaaS. Les coûts
        Connect, litiges et autres charges sont à rapprocher séparément.
      </p>
    </section>
  );
}
