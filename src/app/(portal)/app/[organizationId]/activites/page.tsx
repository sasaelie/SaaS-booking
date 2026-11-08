import { PORTAL } from '../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { ActivityCreationAction, FirstActivityState } from '../../../../_portal/FirstActivityState';
import { ActivityCards } from '../../../../_portal/ActivityCards';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const data = result.value;
  return (
    <>
      <PortalHeading
        title={PORTAL.ACTIVITIES}
        action={
          data.activities.length ? (
            <ActivityCreationAction organization={data.organization} />
          ) : undefined
        }
      />
      {data.activities.length ? (
        <ActivityCards activities={data.activities} organizationId={organizationId} />
      ) : (
        <FirstActivityState organization={data.organization} />
      )}
    </>
  );
}
