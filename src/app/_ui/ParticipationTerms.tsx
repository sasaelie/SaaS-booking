import { AppLink as Link } from './AppLink';
import { SERVICE } from '../../config/service';
import { SIMULATION } from '../../config/simulation';
export function ParticipationTerms({
  text,
  editUrl,
  id = 'participant-terms',
}: {
  readonly text: string;
  readonly editUrl?: string;
  readonly id?: string;
}) {
  return (
    <details id={id} className="event-information">
      <summary>{SERVICE.TERMS}</summary>
      <div className="ice-terms-text">{text}</div>
      {editUrl ? (
        <Link className="portal-secondary-action terms-edit" href={editUrl}>
          {SIMULATION.TERMS_EDIT}
        </Link>
      ) : null}
    </details>
  );
}
