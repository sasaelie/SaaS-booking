import { AppLink as Link } from '../../../../_ui/AppLink';
import { WORKSPACE_NAV } from '../../../../../config/workspace-navigation';
import { SHARE_UI } from '../../../../../config/constants';
import { headers } from 'next/headers';
import { portal } from '../../../../../composition/portal';
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
  const services = portal(await headers());
  const target = services.ok ? await services.value.publication.read({ organizationId }) : null;
  if (!target?.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={SHARE_UI.TITLE} description={SHARE_UI.INTRO} />
      <p>
        <Link className="home-secondary-link" href={`/app/${organizationId}/tests`}>
          {WORKSPACE_NAV.PREVIEW}
        </Link>
      </p>
      <SharePanel data={result.value} {...target.value} />
    </>
  );
}
