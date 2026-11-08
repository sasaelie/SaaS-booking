import type { PortalOverview } from '../../../../core/ports/portal-models';
import Link from 'next/link';
import { PORTAL } from '../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../_portal/load-workspace';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PortalMetric } from '../../../_portal/PortalMetric';
import { PortalEmpty } from '../../../_portal/PortalEmpty';
import { SessionList } from '../../../_portal/SessionList';
import { hasCommercialAccess } from '../../../../core/domain/subscription-access';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const data = result.value;
  const active = hasCommercialAccess(data.organization.access, new Date());
  const action = active ? (
    <Link
      className="liquid-ice-button portal-button"
      href={`/app/${organizationId}/activites/nouvelle`}
    >
      {PORTAL.NEW_ACTIVITY}
    </Link>
  ) : undefined;
  return (
    <>
      <PortalHeading
        title={data.organization.name}
        description={PORTAL.WELCOME_HINT}
        action={action}
      />
      <OverviewMetrics data={data} />
      {!data.activities.length ? (
        <PortalEmpty title={PORTAL.EMPTY_ACTIVITIES} description={PORTAL.EMPTY_ACTIVITIES_HINT}>
          {action}
        </PortalEmpty>
      ) : null}
      <div className="portal-section-heading">
        <h2>{PORTAL.NEXT_SESSIONS}</h2>
        <Link href={`/app/${organizationId}/activites`}>{PORTAL.VIEW_ACTIVITIES}</Link>
      </div>
      <SessionList
        sessions={data.sessions}
        timezone={data.organization.timezone}
        organizationId={organizationId}
      />
    </>
  );
}

function OverviewMetrics({ data }: { readonly data: PortalOverview }) {
  return (
    <div className="portal-metrics">
      <PortalMetric label={PORTAL.ACTIVITY_COUNT} value={data.activities.length} />
      <PortalMetric label={PORTAL.BOOKING_COUNT} value={data.bookingCount} />
      <PortalMetric label={PORTAL.PROOF_COUNT} value={data.pendingProofCount} />
      <PortalMetric label={PORTAL.REFUND_COUNT} value={data.pendingRefundCount} />
    </div>
  );
}
