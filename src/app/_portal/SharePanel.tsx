import type { PortalOverview } from '../../core/ports/portal-models';
import { SHARE_UI } from '../../config/constants';
import { CopyCode } from './CopyCode';
export function SharePanel({
  data,
  appUrl,
}: {
  readonly data: PortalOverview;
  readonly appUrl: string;
}) {
  const organization = data.organization;
  const url = `${appUrl}/${organization.slug}`;
  return (
    <div className="portal-list">
      <section className="portal-panel">
        <h2>{SHARE_UI.DIRECT}</h2>
        <p className="portal-muted">{SHARE_UI.DIRECT_HINT}</p>
        <CopyCode value={url} />
      </section>
      <section className="portal-panel">
        <h2>{SHARE_UI.QR}</h2>
        <p className="portal-muted">{SHARE_UI.QR_HINT}</p>
        <a
          className="liquid-ice-button portal-button"
          href={`/api/portal/qr?organizationId=${organization.id}`}
        >
          {SHARE_UI.DOWNLOAD_QR}
        </a>
      </section>
      <WebsiteSharing data={data} appUrl={appUrl} />
    </div>
  );
}

function WebsiteSharing({
  data,
  appUrl,
}: {
  readonly data: PortalOverview;
  readonly appUrl: string;
}) {
  const organization = data.organization;
  return (
    <section className="portal-panel">
      <h2>{SHARE_UI.WEBSITE}</h2>
      <p className="portal-muted">{SHARE_UI.WEBSITE_HINT}</p>
      {!data.activities.some((activity) => activity.isActive) ? (
        <p>{SHARE_UI.NO_ACTIVITY}</p>
      ) : null}
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
  return (
    <details className="portal-details">
      <summary>{activity.name}</summary>
      <div className="portal-list">
        <h3>{SHARE_UI.INLINE}</h3>
        <CopyCode
          value={`<script src="${appUrl}/widget.js" data-organization="${organization.slug}" data-activity="${activity.id}" data-mode="inline" defer></script>`}
        />
        <h3>{SHARE_UI.FLOATING}</h3>
        <CopyCode
          value={`<script src="${appUrl}/widget.js" data-organization="${organization.slug}" data-activity="${activity.id}" data-mode="floating" defer></script>`}
        />
        <a href={`/api/portal/qr?organizationId=${organization.id}&activityId=${activity.id}`}>
          {SHARE_UI.DOWNLOAD_QR}
        </a>
      </div>
    </details>
  );
}
