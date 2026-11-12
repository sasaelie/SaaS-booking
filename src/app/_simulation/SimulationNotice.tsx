import Link from 'next/link';
import { SIMULATION, simulationPath } from '../../config/simulation';
export function SimulationNotice({ id }: { readonly id: string }) {
  return (
    <aside className="portal-notice simulation-notice" role="note">
      <strong>{SIMULATION.TITLE}</strong>
      <p>{SIMULATION.NOTE}</p>
      <Link className="simulation-nav-link" href={`${simulationPath(id)}/reservations`}>
        {SIMULATION.LIST}
      </Link>
      <Link className="simulation-nav-link" href={`/app/${id}/parametres`}>
        {SIMULATION.RETURN_APPEARANCE}
      </Link>
    </aside>
  );
}
