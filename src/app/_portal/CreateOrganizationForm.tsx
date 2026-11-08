import {
  PORTAL,
  ORGANIZATION_KIND_LABELS,
  PORTAL_TIMEZONES,
  DEFAULTS,
  INPUT_LIMITS,
  SAAS,
} from '../../config/constants';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
import { PortalSelect } from './PortalSelect';
export function CreateOrganizationForm() {
  return (
    <section className="portal-panel portal-narrow">
      <PortalForm action="create-organization" submitLabel={PORTAL.CREATE}>
        <PortalField
          label={PORTAL.NAME}
          name="name"
          required
          minLength={INPUT_LIMITS.NAME_MIN}
          maxLength={INPUT_LIMITS.NAME_MAX}
          autoComplete="organization"
        />
        <PortalField
          label={PORTAL.SLUG}
          name="slug"
          required
          minLength={SAAS.SLUG_MIN}
          maxLength={SAAS.SLUG_MAX}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          hint={PORTAL.SLUG_HINT}
        />
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
