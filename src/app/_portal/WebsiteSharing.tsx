import type { PortalOverview } from '../../core/ports/portal-models';
import { SHARE_UI, EMBED } from '../../config/constants';
import { WEBSITE_PREVIEW as W } from '../../config/website-preview';
import { AppLink as Link } from '../_ui/AppLink';
import { CopyCode } from './CopyCode';
import { WebsiteInstall } from './WebsiteInstall';
type Props = { readonly data: PortalOverview; readonly appUrl: string };
export function WebsiteSharing({ data, appUrl }: Props) {
  const organization = data.organization;
  return (
    <section className="sharing-content">
      <h2>{SHARE_UI.WEBSITE}</h2>
      <p>{SHARE_UI.WEBSITE_BEHAVIOR}</p>
      <ol className="sharing-steps">
        {SHARE_UI.WEBSITE_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <h3>{SHARE_UI.EMBED_CATALOG}</h3>
      <p className="portal-muted">{SHARE_UI.EMBED_CATALOG_HINT}</p>
      <WebsiteInstall appUrl={appUrl} slug={organization.slug} />
      <PrivatePreviewLink slug={organization.slug} />
      {!data.activities.some((activity) => activity.isActive) ? (
        <p>{SHARE_UI.NO_ACTIVITY}</p>
      ) : null}
      <details className="portal-details sharing-activity-options">
        <summary>{SHARE_UI.ACTIVITY_OPTIONS}</summary>
        {data.activities
          .filter((activity) => activity.isActive)
          .map((activity) => (
            <ActivityEmbed
              key={activity.id}
              activity={activity}
              organization={organization}
              appUrl={appUrl}
            />
          ))}
      </details>
      <p className="portal-muted">{SHARE_UI.WEBSITE_NOTE}</p>
    </section>
  );
}
function ActivityEmbed({
  activity,
  organization,
  appUrl,
}: {
  readonly activity: PortalOverview['activities'][number];
  readonly organization: PortalOverview['organization'];
  readonly appUrl: string;
}) {
  const base = `<script src="${appUrl}/widget.js?v=${EMBED.CATALOG_VERSION}" data-organization="${organization.slug}" data-activity="${activity.id}"`;
  return (
    <details className="portal-details">
      <summary>{activity.name}</summary>
      <div className="portal-list">
        <h3>{SHARE_UI.INLINE}</h3>
        <CopyCode value={`${base} data-mode="inline" defer></script>`} />
        <h3>{SHARE_UI.FLOATING}</h3>
        <CopyCode value={`${base} data-mode="floating" defer></script>`} />
        <a href={`/api/portal/qr?organizationId=${organization.id}&activityId=${activity.id}`}>
          {SHARE_UI.DOWNLOAD_QR}
        </a>
      </div>
    </details>
  );
}
function PrivatePreviewLink({ slug }: { readonly slug: string }) {
  return slug === W.SLUG && process.env['APP_ENVIRONMENT'] === W.MODE ? (
    <Link
      href={W.PATH}
      target="_blank"
      rel="noopener noreferrer"
      className="portal-secondary-action"
    >
      {W.LINK}
    </Link>
  ) : null;
}
