import {
  PORTAL,
  ORGANIZATION_KIND_LABELS,
  PORTAL_TIMEZONES,
  DEFAULTS,
} from '../../config/constants';
import { PortalForm } from './PortalForm';
import { OrganizationIdentityFields } from './OrganizationIdentityFields';
import { PortalSelect } from './PortalSelect';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { PLAN_SELECTION } from '../../config/plan-selection';
export function CreateOrganizationForm({
  appUrl = '',
  plan = null,
}: {
  readonly appUrl?: string;
  readonly plan?: PlanIntent | null;
}) {
  return (
    <section className="portal-panel portal-narrow">
      <PortalForm action="create-organization" submitLabel={PORTAL.CREATE}>
        {plan ? <input type="hidden" name={PLAN_SELECTION.FIELD} value={plan} /> : null}
        <OrganizationIdentityFields appUrl={appUrl} />
        <PortalSelect label={PORTAL.KIND} name="kind" defaultValue="NONPROFIT">
          {Object.entries(ORGANIZATION_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </PortalSelect>
        <PortalSelect label={PORTAL.TIMEZONE} name="timezone" defaultValue={DEFAULTS.TIMEZONE}>
          {PORTAL_TIMEZONES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </PortalSelect>
      </PortalForm>
    </section>
  );
}
