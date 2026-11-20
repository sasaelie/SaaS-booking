import { AppLink as Link } from '../_ui/AppLink';
import { SIMULATION, simulationPath } from '../../config/simulation';
export function SimulationNotice({
  id,
  embedded = false,
}: {
  readonly id: string;
  readonly embedded?: boolean;
}) {
  return (
    <aside
      className={embedded ? 'simulation-embedded-notice' : 'portal-notice simulation-notice'}
      role="note"
    >
      <strong>{SIMULATION.TITLE}</strong>
      <p>{SIMULATION.PREVIEW_NOTE}</p>
      <nav className="simulation-shortcuts" aria-label={SIMULATION.TITLE}>
        <Link
          target={embedded ? '_top' : undefined}
          aria-label={`${SIMULATION.SHORT_LIST} — ${SIMULATION.LIST}`}
          className="simulation-nav-link"
          href={`${simulationPath(id)}/reservations`}
        >
          {SIMULATION.SHORT_LIST}
        </Link>
        <Link
          target={embedded ? '_top' : undefined}
          aria-label={SIMULATION.RETURN_APPEARANCE}
          className="simulation-nav-link"
          href={`/app/${id}/parametres`}
        >
          {SIMULATION.SHORT_RETURN}
        </Link>
      </nav>
    </aside>
  );
}
