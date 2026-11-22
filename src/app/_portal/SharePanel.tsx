import { canUsePro } from '../../core/domain/commercial';
import { PLAN_UI } from '../../config/commercial';
import { SHARE_UI } from '../../config/constants';
import type { PortalOverview } from '../../core/ports/portal-models';
import { AppLink as Link } from '../_ui/AppLink';
import { CopyCode } from './CopyCode';
import { SharingModes } from './SharingModes';
import { WebsiteSharing } from './WebsiteSharing';
import { PUBLIC_TEST } from '../../config/public-test';
import { TestBookingPublication } from './TestBookingPublication';
import { STAGING } from '../../config/staging';
type Props = {
  readonly data: PortalOverview;
  readonly appUrl: string;
  readonly published?: boolean;
  readonly activationRequired?: boolean;
};
export function SharePanel({ data, appUrl, published = false, activationRequired = false }: Props) {
  if (activationRequired) return <TestBookingPublication organizationId={data.organization.id} />;
  const pro = canUsePro(data.organization.access, new Date());
  const privatePreview = process.env['APP_ENVIRONMENT'] === STAGING.MODE && !published;
  return (
    <div className="portal-list portal-panel portal-task-sections sharing-panel">
      {privatePreview || published ? (
        <p role="note">{published ? PUBLIC_TEST.SHARING_NOTICE : PUBLIC_TEST.PRIVATE_NOTICE}</p>
      ) : null}
      <SharingModes
        social={<SocialSharing data={data} appUrl={appUrl} />}
        website={
          pro ? (
            <WebsiteSharing data={data} appUrl={appUrl} privatePreview={privatePreview} />
          ) : (
            <section className="sharing-content">
              <h2>{SHARE_UI.WEBSITE}</h2>
              <p>
                {PLAN_UI.PRO_REQUIRED}{' '}
                <Link href={`/app/${data.organization.id}/abonnement`}>Studio Pro</Link>
              </p>
            </section>
          )
        }
      />
      <details className="portal-details sharing-members">
        <summary>{SHARE_UI.MEMBERS}</summary>
        <p>
          <strong>{SHARE_UI.MEMBERS_STATUS}</strong>
        </p>
        <p>{SHARE_UI.MEMBERS_NOTE}</p>
        <p className="portal-muted">{SHARE_UI.MEMBERS_LINK_NOTE}</p>
      </details>
    </div>
  );
}
function SocialSharing({ data, appUrl }: Props) {
  const organization = data.organization,
    url = `${appUrl}/${organization.slug}`;
  return (
    <section className="sharing-content">
      <h2>{SHARE_UI.DIRECT}</h2>
      <p>{SHARE_UI.SOCIAL_HINT}</p>
      <ol className="sharing-steps">
        {SHARE_UI.SOCIAL_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <CopyCode value={url} buttonLabel={SHARE_UI.COPY_LINK} />
      <Link className="home-secondary-link" href={url} target="_blank" rel="noopener noreferrer">
        {SHARE_UI.OPEN_PAGE}
      </Link>
      {canUsePro(organization.access, new Date()) ? (
        <SocialQr organizationId={organization.id} />
      ) : null}
    </section>
  );
}
function SocialQr({ organizationId }: { readonly organizationId: string }) {
  return (
    <div className="sharing-qr">
      <h3>{SHARE_UI.QR}</h3>
      <p className="portal-muted">{SHARE_UI.QR_HINT}</p>
      <a
        className="liquid-ice-button portal-button"
        href={`/api/portal/qr?organizationId=${organizationId}&format=pdf`}
      >
        {SHARE_UI.DOWNLOAD_QR}
      </a>
    </div>
  );
}
