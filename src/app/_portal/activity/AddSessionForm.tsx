'use client';
import { ACTIVITY_UI } from '../../../config/constants';
import { PortalForm } from '../PortalForm';
import { ManualDateFields } from './ManualDateFields';
export function AddSessionForm({
  activityId,
  organizationId,
  disabled,
}: {
  readonly activityId: string;
  readonly organizationId: string;
  readonly disabled: boolean;
}) {
  return (
    <details className="portal-panel portal-details">
      <summary>{ACTIVITY_UI.ADD_SESSION}</summary>
      <div>
        <PortalForm
          action="add-session"
          organizationId={organizationId}
          disabled={disabled}
          submitLabel={ACTIVITY_UI.ADD_SESSION}
        >
          <input type="hidden" name="activityId" value={activityId} />
          <ManualDateFields />
        </PortalForm>
      </div>
    </details>
  );
}
