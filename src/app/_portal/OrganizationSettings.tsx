import type { OrganizationSummary } from '../../core/ports/portal-models';
import { PORTAL, SETTINGS_UI, INPUT_LIMITS, MEMBER_ROLES } from '../../config/constants';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
export function OrganizationSettings({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  return (
    <section className="portal-panel">
      <PortalForm
        action="settings"
        organizationId={organization.id}
        disabled={organization.role !== MEMBER_ROLES.OWNER}
      >
        <PortalField
          label={PORTAL.NAME}
          name="name"
          required
          minLength={INPUT_LIMITS.NAME_MIN}
          maxLength={INPUT_LIMITS.NAME_MAX}
          defaultValue={organization.name}
        />
        <input type="hidden" name="theme" value={organization.theme} />
        <BankSettings organization={organization} />
        <p className="portal-muted">{SETTINGS_UI.BANK_HINT}</p>
        <label className="portal-check">
          <input
            type="checkbox"
            name="autoDeleteBankProof"
            defaultChecked={organization.autoDeleteBankProof}
          />
          {SETTINGS_UI.DELETE_PROOF}
        </label>
      </PortalForm>
    </section>
  );
}

function BankSettings({ organization }: { readonly organization: OrganizationSummary }) {
  return (
    <div className="portal-form-grid">
      <PortalField
        label={SETTINGS_UI.IBAN}
        name="bankIban"
        defaultValue={organization.bankIban ?? ''}
      />
      <PortalField
        label={SETTINGS_UI.BANK_NAME}
        name="bankAccountName"
        defaultValue={organization.bankAccountName ?? ''}
      />
    </div>
  );
}
