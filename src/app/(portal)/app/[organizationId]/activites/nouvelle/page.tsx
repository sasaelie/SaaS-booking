import { ACTIVITY_UI } from '../../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../../_portal/PortalHeading';
import { PortalError } from '../../../../../_portal/PortalError';
import { CreateActivityForm } from '../../../../../_portal/activity/CreateActivityForm';
import { hasCommercialAccess } from '../../../../../../core/domain/subscription-access';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={ACTIVITY_UI.TITLE} description={ACTIVITY_UI.INTRO} />
      <CreateActivityForm
        organizationId={organizationId}
        disabled={!hasCommercialAccess(result.value.organization.access, new Date())}
      />
    </>
  );
}
