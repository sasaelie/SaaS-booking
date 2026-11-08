import Link from 'next/link';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { hasCommercialAccess } from '../../core/domain/subscription-access';
import { PORTAL } from '../../config/constants';
import { STAGING, paymentsEnabled } from '../../config/staging';
import { PortalEmpty } from './PortalEmpty';

export function ActivityCreationAction({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  const active = hasCommercialAccess(organization.access, new Date());
  const billingLabel = paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] })
    ? PORTAL.BILLING_LINK
    : STAGING.ACCESS_LINK;
  const href = active
    ? `/app/${organization.id}/activites/nouvelle`
    : `/app/${organization.id}/abonnement`;
  return (
    <Link className="liquid-ice-button portal-button" href={href}>
      {active ? PORTAL.NEW_ACTIVITY : billingLabel}
    </Link>
  );
}

export function FirstActivityState({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  const active = hasCommercialAccess(organization.access, new Date());
  const inactiveHint = paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] })
    ? PORTAL.FIRST_ACTIVITY_ACCESS_HINT
    : STAGING.ACCESS_HINT;
  const hint = organization.access.suspendedAt
    ? PORTAL.SUSPENDED_HINT
    : active
      ? PORTAL.EMPTY_ACTIVITIES_HINT
      : inactiveHint;
  return (
    <PortalEmpty title={PORTAL.EMPTY_ACTIVITIES} description={hint}>
      <ActivityCreationAction organization={organization} />
    </PortalEmpty>
  );
}
