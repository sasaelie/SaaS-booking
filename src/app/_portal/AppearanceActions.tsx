import Link from 'next/link';
import { SIMULATION, simulationPath } from '../../config/simulation';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { APPEARANCE as UI } from '../../config/appearance';
import { MEMBER_ROLES, PORTAL } from '../../config/constants';
import type { useAppearance } from './use-appearance';
interface Props {
  readonly state: ReturnType<typeof useAppearance>;
  readonly organization: OrganizationSummary;
}
export function AppearanceActions({ state, organization }: Props) {
  const disabled = state.pending || organization.role !== MEMBER_ROLES.OWNER;
  const message = state.message || (state.dirty ? UI.DIRTY : '');
  const tone = state.message ? (state.message === UI.SAVED ? 'green' : 'red') : state.dirty ? 'orange' : undefined;
  return (
    <footer className="appearance-footer">
      <p className="appearance-feedback" role="status" data-tone={tone}>
        {message}
      </p>
      <div className="appearance-actions">
        <button
          type="button"
          className="liquid-ice-button portal-button portal-action-button"
          data-tone="green"
          onClick={state.save}
          disabled={disabled || !state.dirty}
        >
          {state.pending ? PORTAL.SAVING : UI.SAVE}
        </button>
        <AppearanceSecondary state={state} organization={organization} />
      </div>
    </footer>
  );
}

function AppearanceSecondary({ state, organization }: Props) {
  const disabled = state.pending || organization.role !== MEMBER_ROLES.OWNER;
  return (
    <>
      <button type="button" className="portal-secondary-action" onClick={state.reset} disabled={disabled}>
        {UI.RESET}
      </button>
      <Link
        className="portal-secondary-action appearance-public-link"
        href={simulationPath(organization.id)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {SIMULATION.OPEN}
      </Link>
    </>
  );
}
