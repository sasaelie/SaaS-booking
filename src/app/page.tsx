import { headers } from 'next/headers';
import { SHARE_UI } from '../config/constants';
import { PlanCards } from './_portal/PlanCards';
import { PlanComparison } from './_portal/PlanComparison';
import { currentVisitor } from '../composition/current-visitor';
import { HomeActions } from './_auth/HomeActions';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const actor = await currentVisitor(new Headers(await headers()));
  return (
    <main className="portal-auth">
      <section className="ice-cube-shell portal-auth-card">
        <span className="ice-brand-mark" aria-hidden="true" />
        <h1>{SHARE_UI.LANDING_TITLE}</h1>
        <p>{SHARE_UI.LANDING_HINT}</p>
        <HomeActions name={actor?.name ?? null} />
        <PlanCards />
        <PlanComparison />
      </section>
    </main>
  );
}
