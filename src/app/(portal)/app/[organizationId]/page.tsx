import type { PortalOverview } from '../../../../core/ports/portal-models';
import Link from 'next/link';
import { PORTAL } from '../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../_portal/load-workspace';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PortalMetric } from '../../../_portal/PortalMetric';
import { ActivityCreationAction, FirstActivityState } from '../../../_portal/FirstActivityState';
import { SessionList } from '../../../_portal/SessionList';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const data = result.value;
  return (
    <>
      <PortalHeading
        title={data.organization.name}
        description={PORTAL.WELCOME_HINT}
        action={
          data.activities.length ? (
            <ActivityCreationAction organization={data.organization} />
          ) : undefined
        }
      />
      {data.activities.length ? <OverviewMetrics data={data} /> : null}
      {!data.activities.length ? <FirstActivityState organization={data.organization} /> : null}
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
