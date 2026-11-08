import { APPEARANCE } from '../../../../../config/appearance';
import { headers } from 'next/headers';
import { portal } from '../../../../../composition/portal';
import { ConnectSettings } from '../../../../_portal/ConnectSettings';
import { SETTINGS_UI } from '../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { OrganizationSettings } from '../../../../_portal/OrganizationSettings';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const services = portal(new Headers(await headers()));
  const permission = services.ok ? await services.value.platform.permitted() : null;
  const organization = result.value.organization;
  return (
    <>
      <PortalHeading title={APPEARANCE.SETTINGS} description={SETTINGS_UI.INTRO} />
      <div className="portal-section-stack">
        <OrganizationSettings organization={organization} />
      </div>
      <ConnectSettings
        organization={organization}
        operator={Boolean(permission?.ok && permission.value)}
      />
    </>
  );
}
