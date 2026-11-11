import type { PlatformOverview } from '../../core/ports/portal-models';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
import { PortalSelect } from './PortalSelect';
export function PlatformCostForm({ data }: { readonly data: PlatformOverview }) {
  return (
    <details className="portal-panel portal-details">
      <summary>Rapprocher un coût exceptionnel réel</summary>
      <div>
        <p className="portal-muted">
          Enregistrez un coût justifié par une référence fournisseur unique. Les frais déjà
          rapprochés dans un paiement ne doivent pas être saisis à nouveau.
        </p>
        <PortalForm action="platform-cost" submitLabel="Enregistrer le coût">
          <PortalSelect label="Espace concerné" name="costOrganizationId" required>
            {data.organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </PortalSelect>
          <CostFields />
        </PortalForm>
      </div>
    </details>
  );
}

function CostFields() {
  return (
    <div className="portal-form-grid">
      <PortalSelect label="Catégorie" name="category">
        <option value="CONNECT">Stripe Connect</option>
        <option value="DISPUTE">Litige</option>
        <option value="CONVERSION">Conversion</option>
        <option value="OTHER">Autre</option>
      </PortalSelect>
      <PortalField label="Montant réel (€)" name="costAmount" inputMode="decimal" required />
      <PortalField label="Référence du justificatif" name="sourceReference" required />
      <PortalField label="Date du coût" type="date" name="occurredOn" required />
    </div>
  );
}
