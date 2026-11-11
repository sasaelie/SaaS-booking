import { canUsePro } from '../../../../../../core/domain/commercial';
import { ACTIVITY_UI } from '../../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../../_portal/PortalHeading';
import { PortalError } from '../../../../../_portal/PortalError';
import { CreateActivityForm } from '../../../../../_portal/activity/CreateActivityForm';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={ACTIVITY_UI.TITLE} description={ACTIVITY_UI.INTRO} />
      <CreateActivityForm
        organizationId={organizationId}
        pro={canUsePro(result.value.organization.access, new Date())}
        disabled={Boolean(result.value.organization.access.suspendedAt)}
      />
    </>
  );
}
