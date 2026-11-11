import type { PortalOverview } from '../../core/ports/portal-models';
import { PLAN_UI } from '../../config/commercial';
import { PortalForm } from './PortalForm';
export function LibertySelection({ data }: { readonly data: PortalOverview }) {
  return (
    <section className="portal-panel">
      <h2>{PLAN_UI.SELECT}</h2>
      <p className="portal-muted">
        Choisissez au maximum deux activités. Les autres restent consultables après le retour en
        Liberté.
      </p>
      <PortalForm
        action="liberty-selection"
        organizationId={data.organization.id}
        submitLabel={PLAN_UI.SELECT_SAVE}
      >
        {data.activities
          .filter((activity) => activity.isActive)
          .map((activity) => (
            <label className="portal-check" key={activity.id}>
              <input
                type="checkbox"
                name="activityIds"
                value={activity.id}
                defaultChecked={data.organization.access.libertyActivityIds?.includes(activity.id)}
              />
              {activity.name}
            </label>
          ))}
      </PortalForm>
    </section>
  );
}
