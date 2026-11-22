import { SESSION_EDIT as UI } from '../../config/session-edit';
import { INPUT_LIMITS } from '../../config/constants';
import type { SessionDetails } from '../../core/ports/session-details';
import { AdminOperation } from './AdminOperation';
import { PortalField } from './PortalField';
export function EditSession({ data }: { readonly data: SessionDetails }) {
  const { session, organization } = data;
  if (session.isCancelled || session.startsAt <= new Date()) return null;
  return (
    <details className="portal-details">
      <summary>{UI.TITLE}</summary>
      <p className="portal-muted">{UI.SCOPE}</p>
      <AdminOperation
        label={UI.SAVE}
        confirmationText={UI.IMPACT}
        command={{
          action: 'update-session',
          organizationId: organization.id,
          activityId: session.activityId,
          startsAt: session.startsAt.toISOString(),
          endsAt: session.endsAt.toISOString(),
          capacity: session.capacity,
        }}
      >
        <SessionEditFields data={data} />
        <small>
          {organization.timezone} · {UI.PENDING}
        </small>
      </AdminOperation>
    </details>
  );
}
function localInput(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((row) => row.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

function SessionEditFields({ data }: { readonly data: SessionDetails }) {
  const { session, organization } = data;
  return (
    <div className="portal-form-grid">
      <PortalField
        name="newStart"
        label={UI.START}
        type="datetime-local"
        required
        defaultValue={localInput(session.startsAt, organization.timezone)}
      />
      <PortalField
        name="newEnd"
        label={UI.END}
        type="datetime-local"
        required
        defaultValue={localInput(session.endsAt, organization.timezone)}
      />
      <PortalField
        name="newCapacity"
        label={UI.CAPACITY}
        type="number"
        min={1}
        max={INPUT_LIMITS.MAX_CAPACITY}
        required
        defaultValue={session.capacity}
      />
    </div>
  );
}
