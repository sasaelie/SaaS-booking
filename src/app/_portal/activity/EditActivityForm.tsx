'use client';
import { useSearchParams } from 'next/navigation';
import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI } from '../../../config/constants';
import { PortalForm } from '../PortalForm';
import { ActivityBasics } from './ActivityBasics';
import { ActivityRules } from './ActivityRules';
export function EditActivityForm({
  activity,
  organizationId,
  disabled,
  pro = true,
}: {
  readonly activity: PortalActivity;
  readonly organizationId: string;
  readonly disabled: boolean;
  readonly pro?: boolean;
}) {
  const editTerms = useSearchParams().get('edit') === 'terms';
  return (
    <details id="activity-edit" className="portal-panel portal-details" open={editTerms || undefined}>
      <summary>{ACTIVITY_UI.EDIT}</summary>
      <div>
        <PortalForm action="update-activity" organizationId={organizationId} disabled={disabled}>
          <input type="hidden" name="activityId" value={activity.id} />
          <ActivityBasics initial={activity} pro={pro} />
          <ActivityRules initial={activity} />
        </PortalForm>
      </div>
    </details>
  );
}
