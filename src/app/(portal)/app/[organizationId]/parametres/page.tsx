import { headers } from 'next/headers';
import { portal } from '../../../../../composition/portal';
import { ConnectSettings } from '../../../../_portal/ConnectSettings';
import { SETTINGS_UI, MEMBER_ROLES } from '../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { OrganizationSettings } from '../../../../_portal/OrganizationSettings';
import { MediaUpload } from '../../../../_portal/MediaUpload';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const services = portal(new Headers(await headers()));
  const permission = services.ok ? await services.value.platform.permitted() : null;
  const organization = result.value.organization;
  const disabled = organization.role !== MEMBER_ROLES.OWNER;
  return (
    <>
      <PortalHeading title={SETTINGS_UI.TITLE} description={SETTINGS_UI.INTRO} />
      <div className="portal-section-stack">
        <OrganizationSettings organization={organization} />
      </div>
      <div className="portal-section-heading">
        <h2>{SETTINGS_UI.VISUAL_IDENTITY}</h2>
      </div>
      <div className="portal-cards">
        <MediaUpload
          organizationId={organizationId}
          kind="logo"
          existing={organization.hasLogo}
          disabled={disabled}
        />
        <MediaUpload
          organizationId={organizationId}
          kind="background"
          existing={organization.hasBackground}
          disabled={disabled}
        />
      </div>
      <ConnectSettings
        organization={organization}
        operator={Boolean(permission?.ok && permission.value)}
      />
    </>
  );
}
