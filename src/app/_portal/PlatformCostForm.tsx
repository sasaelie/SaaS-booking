import type { PlatformOverview } from '../../core/ports/portal-models';
import { PortalForm } from './PortalForm';
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
          <label>
            Espace concerné
            <select name="costOrganizationId" required>
              {data.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <CostFields />
        </PortalForm>
      </div>
    </details>
  );
}

function CostFields() {
  return (
    <>
      <label>
        Catégorie
        <select name="category">
          <option value="CONNECT">Stripe Connect</option>
          <option value="DISPUTE">Litige</option>
          <option value="CONVERSION">Conversion</option>
          <option value="OTHER">Autre</option>
        </select>
      </label>
      <label>
        Montant réel (€)
        <input name="costAmount" inputMode="decimal" required />
      </label>
      <label>
        Référence du justificatif
        <input name="sourceReference" required />
      </label>
      <label>
        Date du coût
        <input type="date" name="occurredOn" required />
      </label>
    </>
  );
}
