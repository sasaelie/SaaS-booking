import Link from 'next/link';
import { PORTAL } from '../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { PortalEmpty } from '../../../../_portal/PortalEmpty';
import { ActivityCards } from '../../../../_portal/ActivityCards';
import { hasCommercialAccess } from '../../../../../core/domain/subscription-access';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const data = result.value;
  const action = hasCommercialAccess(data.organization.access, new Date()) ? (
    <Link
      className="liquid-ice-button portal-button"
      href={`/app/${organizationId}/activites/nouvelle`}
    >
      {PORTAL.NEW_ACTIVITY}
    </Link>
  ) : undefined;
  return (
    <>
      <PortalHeading title={PORTAL.ACTIVITIES} action={action} />
      {data.activities.length ? (
        <ActivityCards activities={data.activities} organizationId={organizationId} />
      ) : (
        <PortalEmpty title={PORTAL.EMPTY_ACTIVITIES} description={PORTAL.EMPTY_ACTIVITIES_HINT}>
          {action}
        </PortalEmpty>
      )}
    </>
  );
}
