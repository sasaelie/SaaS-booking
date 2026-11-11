import type { OrganizationSummary } from '../../core/ports/portal-models';
import { canUsePro } from '../../core/domain/commercial';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
export function OnlineVoucher({ organization }: { readonly organization: OrganizationSummary }) {
  if (!canUsePro(organization.access, new Date())) return null;
  return (
    <details className="portal-panel portal-details">
      <summary>Valider un report pour un cours en ligne</summary>
      <div>
        <p className="portal-muted">
          Le code sera consommé une seule fois. Activez cette possibilité dans les règles de
          l’activité d’origine.
        </p>
        <PortalForm
          action="redeem-online-voucher"
          organizationId={organization.id}
          submitLabel="Valider le report"
        >
          <PortalField label="Code de report" name="code" required placeholder="RPT-…" />
        </PortalForm>
      </div>
    </details>
  );
}
