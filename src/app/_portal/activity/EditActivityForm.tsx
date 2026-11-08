'use client';
import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI } from '../../../config/constants';
import { PortalForm } from '../PortalForm';
import { ActivityBasics } from './ActivityBasics';
import { ActivityRules } from './ActivityRules';
export function EditActivityForm({
  activity,
  organizationId,
  disabled,
}: {
  readonly activity: PortalActivity;
  readonly organizationId: string;
  readonly disabled: boolean;
}) {
  return (
    <details className="portal-panel portal-details">
      <summary>{ACTIVITY_UI.EDIT}</summary>
      <div>
        <PortalForm action="update-activity" organizationId={organizationId} disabled={disabled}>
          <input type="hidden" name="activityId" value={activity.id} />
          <ActivityBasics initial={activity} />
          <ActivityRules initial={activity} />
        </PortalForm>
      </div>
    </details>
  );
}
