import Link from 'next/link';
import { PORTAL } from '../../config/constants';
import { hasCommercialAccess } from '../../core/domain/subscription-access';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { portalDate } from './date-label';
export function AccessNotice({ organization }: { readonly organization: OrganizationSummary }) {
  const access = organization.access;
  if (access.complimentary && !access.suspendedAt)
    return <aside className="portal-notice">{PORTAL.COMP_TITLE}</aside>;
  if (hasCommercialAccess(access, new Date()) && !access.cancelAtPeriodEnd) return null;
  const active = hasCommercialAccess(access, new Date());
  return (
    <aside className="portal-notice" data-warning={!active}>
      <strong>
        {access.suspendedAt
          ? PORTAL.SUSPENDED_TITLE
          : active
            ? PORTAL.CANCEL_TITLE
            : PORTAL.EXPIRED_TITLE}
      </strong>
      <p>
        {access.suspendedAt
          ? PORTAL.SUSPENDED_HINT
          : active
            ? PORTAL.CANCEL_HINT
            : PORTAL.EXPIRED_HINT}
        {active && access.currentPeriodEnd
          ? ` ${portalDate(access.currentPeriodEnd, organization.timezone)}`
          : ''}
      </p>
      <Link href={`/app/${organization.id}/abonnement`}>{PORTAL.BILLING_LINK}</Link>
    </aside>
  );
}
