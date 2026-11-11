'use client';
import { ACTIVITY_UI } from '../../../config/constants';
import { PortalForm } from '../PortalForm';
import { ActivityBasics } from './ActivityBasics';
import { ActivitySchedule } from './ActivitySchedule';
import { ActivityRules } from './ActivityRules';
export function CreateActivityForm({
  organizationId,
  disabled,
  pro = true,
}: {
  readonly organizationId: string;
  readonly disabled: boolean;
  readonly pro?: boolean;
}) {
  return (
    <section className="portal-panel">
      <PortalForm
        action="create-activity"
        organizationId={organizationId}
        submitLabel={ACTIVITY_UI.CREATE}
        disabled={disabled}
      >
        <ActivityBasics pro={pro} />
        <ActivitySchedule />
        <ActivityRules />
      </PortalForm>
    </section>
  );
}
