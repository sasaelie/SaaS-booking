import { SHARE_UI } from '../../../../../config/constants';
import { readEnvironment } from '../../../../../config/env';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { SharePanel } from '../../../../_portal/SharePanel';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  const env = readEnvironment();
  if (!result.ok || !env.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={SHARE_UI.TITLE} description={SHARE_UI.INTRO} />
      <SharePanel data={result.value} appUrl={env.value.NEXT_PUBLIC_APP_URL} />
    </>
  );
}
