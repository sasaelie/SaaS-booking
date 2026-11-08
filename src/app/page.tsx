import Link from 'next/link';
import { SHARE_UI, BILLING_UI, SAAS } from '../config/constants';
import { formatMoney } from './_ui/format-money';
export default function Home() {
  return (
    <main className="portal-auth">
      <section className="ice-cube-shell portal-auth-card">
        <span className="ice-brand-mark" aria-hidden="true" />
        <h1>{SHARE_UI.LANDING_TITLE}</h1>
        <p>{SHARE_UI.LANDING_HINT}</p>
        <p className="portal-price">
          {formatMoney(SAAS.MONTHLY_CENTS, SAAS.CURRENCY)}
          <small>{BILLING_UI.PER_MONTH}</small>
        </p>
        <p className="portal-muted">{BILLING_UI.NO_COMMISSION}</p>
        <div className="portal-share-buttons portal-landing-actions">
          <Link className="liquid-ice-button portal-button" href="/inscription">
            {SHARE_UI.START}
          </Link>
          <Link className="liquid-ice-button portal-button" href="/connexion">
            {SHARE_UI.LOGIN}
          </Link>
        </div>
        <p className="portal-muted">{SHARE_UI.LANDING_CANCEL_NOTE}</p>
      </section>
    </main>
  );
}
