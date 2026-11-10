import { SessionInformation } from './SessionInformation';
import { SessionAttendees } from './SessionAttendees';
import Link from 'next/link';
import type { SessionDetails as Details } from '../../core/ports/session-details';
import { SESSION_UI as UI } from '../../config/session-details';
import { StatusBadge } from './StatusBadge';
export function SessionDetails({ data }: { readonly data: Details }) {
  const { organization: org, activity, session } = data;
  const closed = session.isCancelled || session.startsAt <= new Date();
  return (
    <div className="portal-section-stack">
      <Link className="portal-return-link" href={`/app/${org.id}`}>
        ← {UI.BACK}
      </Link>
      <header className="portal-session-heading">
        <p>{UI.TITLE}</p>
        <h1>{activity.name}</h1>
        <StatusBadge
          status={{
            tone: closed ? 'red' : 'green',
            label: session.isCancelled ? UI.CANCELLED : closed ? UI.ENDED : UI.ACTIVE,
          }}
        />
      </header>
      <SessionInformation data={data} />
      <SessionAttendees data={data} />
    </div>
  );
}
