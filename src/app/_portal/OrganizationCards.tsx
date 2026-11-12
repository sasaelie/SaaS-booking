import Link from 'next/link';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { PORTAL, BILLING_UI } from '../../config/constants';
import { hasCommercialAccess } from '../../core/domain/subscription-access';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { planPath } from '../../lib/plan-selection';
export function OrganizationCards({
  organizations,
  plan = null,
}: {
  readonly organizations: readonly OrganizationSummary[];
  readonly plan?: PlanIntent | null;
}) {
  return (
    <div className="portal-cards">
      {organizations.map((organization) => (
        <Link
          key={organization.id}
          className="portal-panel portal-organization-card"
          href={
            plan ? planPath(`/app/${organization.id}/abonnement`, plan) : `/app/${organization.id}`
          }
        >
          <span className="portal-badge">
            {organization.access.complimentary
              ? BILLING_UI.COMPLIMENTARY
              : hasCommercialAccess(organization.access, new Date())
                ? BILLING_UI.ACTIVE
                : 'Liberté'}
          </span>
          <h2>{organization.name}</h2>
          <span>{PORTAL.MANAGE} →</span>
        </Link>
      ))}
    </div>
  );
}
