import type { SessionDetails as Details } from '../../core/ports/session-details';
import { SESSION_UI as UI } from '../../config/session-details';
import { SessionCancellation } from './SessionList';
import { portalDate } from './date-label';
import { formatMoney } from '../_ui/format-money';
export function SessionInformation({ data }: { readonly data: Details }) {
  const { organization: org, activity, session } = data;
  return (
    <section className="portal-panel portal-session-details">
      {activity.description ? <p>{activity.description}</p> : null}
      <dl>
        <div>
          <dt>{UI.HOURS}</dt>
          <dd>
            {portalDate(session.startsAt, org.timezone)} —{' '}
            {portalDate(session.endsAt, org.timezone)}
            <small>{org.timezone}</small>
          </dd>
        </div>
        <div>
          <dt>{UI.VENUE}</dt>
          <dd>{activity.address || UI.VENUE_UNSET}</dd>
        </div>
        <div>
          <dt>{session.isCancelled ? UI.TOTAL_CAPACITY : UI.CAPACITY}</dt>
          <dd>{session.isCancelled ? session.capacity : session.availabilityLabel}</dd>
        </div>
        <div>
          <dt>{UI.PRICE}</dt>
          <dd>{formatMoney(activity.priceCents, activity.currency)}</dd>
        </div>
      </dl>
      {activity.practicalInfo ? (
        <details className="portal-details">
          <summary>{UI.PRACTICAL}</summary>
          <p>{activity.practicalInfo}</p>
        </details>
      ) : null}
      <SessionCancellation session={session} organizationId={org.id} />
    </section>
  );
}
