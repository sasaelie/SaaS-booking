'use client';
import { ACTIVITY_UI } from '../../../config/constants';
import { AdminOperation } from '../AdminOperation';
import { PortalField } from '../PortalField';
export function PauseForm({
  organizationId,
  activityId,
}: {
  readonly organizationId: string;
  readonly activityId: string;
}) {
  return (
    <details className="portal-panel portal-details">
      <summary>{ACTIVITY_UI.PAUSE}</summary>
      <div>
        <p className="portal-muted">{ACTIVITY_UI.PAUSE_HINT}</p>
        <AdminOperation
          label={ACTIVITY_UI.PAUSE}
          reasonRequired
          command={{ action: 'pause-local', organizationId, activityId }}
        >
          <div className="portal-form-grid">
            <PortalField label={ACTIVITY_UI.PAUSE_FROM} name="date" type="date" required />
            <PortalField label={ACTIVITY_UI.PAUSE_TO} name="endDate" type="date" required />
          </div>
        </AdminOperation>
      </div>
    </details>
  );
}
