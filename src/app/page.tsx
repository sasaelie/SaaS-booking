import Link from 'next/link';
import { SHARE_UI } from '../config/constants';
import { PlanCards } from './_portal/PlanCards';
export default function Home() {
  return (
    <main className="portal-auth">
      <section className="ice-cube-shell portal-auth-card">
        <span className="ice-brand-mark" aria-hidden="true" />
        <h1>{SHARE_UI.LANDING_TITLE}</h1>
        <p>{SHARE_UI.LANDING_HINT}</p>
        <div className="portal-share-buttons portal-landing-actions">
          <Link className="liquid-ice-button portal-button" href="/inscription">
            {SHARE_UI.START}
          </Link>
          <Link className="liquid-ice-button portal-button" href="/connexion">
            {SHARE_UI.LOGIN}
          </Link>
        </div>
        <PlanCards />
      </section>
    </main>
  );
}
