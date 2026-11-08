import { AppearanceEditor } from '../../../../_portal/AppearanceEditor';
import { APPEARANCE } from '../../../../../config/appearance';
import { MEMBER_ROLES } from '../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { MediaUpload } from '../../../../_portal/MediaUpload';
export default async function Page({ params }: WorkspacePageProps) {
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const organization = result.value.organization;
  const disabled = organization.role !== MEMBER_ROLES.OWNER;
  return (
    <>
      <PortalHeading title={APPEARANCE.TITLE} description={APPEARANCE.INTRO} />
      <AppearanceEditor key={organizationId} organization={organization} />
      <details className="portal-panel appearance-media">
        <summary>{APPEARANCE.MEDIA}</summary>
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
      </details>
    </>
  );
}
