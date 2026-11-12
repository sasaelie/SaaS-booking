import Link from 'next/link';
import { SIMULATION, simulationPath } from '../../config/simulation';
export function SimulationNotice({ id }: { readonly id: string }) {
  return (
    <aside className="portal-notice simulation-notice" role="note">
      <strong>{SIMULATION.TITLE}</strong>
      <p>{SIMULATION.PREVIEW_NOTE}</p>
      <nav className="simulation-shortcuts" aria-label={SIMULATION.TITLE}>
        <Link aria-label={SIMULATION.LIST} className="simulation-nav-link" href={`${simulationPath(id)}/reservations`}>
          {SIMULATION.SHORT_LIST}
        </Link>
        <Link aria-label={SIMULATION.RETURN_APPEARANCE} className="simulation-nav-link" href={`/app/${id}/parametres`}>
          {SIMULATION.SHORT_RETURN}
        </Link>
      </nav>
    </aside>
  );
}
