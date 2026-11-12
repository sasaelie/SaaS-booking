import Link from 'next/link';
import { SERVICE } from '../../config/service';
import { SIMULATION } from '../../config/simulation';
export function ParticipationTerms({ text, editUrl }: { readonly text: string; readonly editUrl?: string }) {
  return (
    <details id="participant-terms" className="event-information">
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
