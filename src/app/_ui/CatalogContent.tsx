import Link from 'next/link';
import type { PublicCatalog } from '../../core/ports/public-catalog.port';
import { SHARE_UI, AUDIENCE_LABELS } from '../../config/constants';
import { PLAN_UI } from '../../config/commercial';
import { simulationPath } from '../../config/simulation';
import { StoryPanel } from './StoryPanel';
import { ColorScene } from './ColorScene';
import { BookingBrand } from './BookingBrand';
import { SocialLinks } from './SocialLinks';
import { PlatformSignature } from './PlatformSignature';
import { PortalHeading } from '../_portal/PortalHeading';
import { PortalEmpty } from '../_portal/PortalEmpty';
import { formatMoney } from './format-money';
export function CatalogContent({
  data,
  simulationId,
}: {
  readonly data: PublicCatalog;
  readonly simulationId?: string;
}) {
  return (
    <div className="ice-branded-page participant-catalog">
      {data.participantHue != null ? <ColorScene hue={data.participantHue} /> : null}
      <div className="catalog-identity">
        <BookingBrand name={data.name} logoUrl={data.hasLogo ? `/api/branding/${data.organizationId}/logo` : null} />
        <SocialLinks links={data.socialLinks} />
      </div>
      <PortalHeading title={SHARE_UI.CATALOG_TITLE} />
      {!data.activities.length ? <PortalEmpty title={SHARE_UI.CATALOG_EMPTY} /> : null}
      <CatalogActivities data={data} simulationId={simulationId} />
      {data.showPlatformSignature ? <PlatformSignature /> : null}
    </div>
  );
}
function CatalogActivities({ data, simulationId }: { readonly data: PublicCatalog; readonly simulationId?: string }) {
  return (
    <div className="portal-cards catalog-grid">
      {data.activities.map((activity) => (
        <CatalogCard key={activity.id} data={data} activity={activity} simulationId={simulationId} />
      ))}
    </div>
  );
}
interface CatalogCardProps {
  readonly data: PublicCatalog;
  readonly activity: PublicCatalog['activities'][number];
  readonly simulationId?: string;
}
function CatalogCard({ data, activity, simulationId }: CatalogCardProps) {
  const content = (
    <>
      <span className="portal-badge">{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
      <h2>{activity.name}</h2>
      {activity.description ? <p className="portal-muted catalog-description">{activity.description}</p> : null}
      <div className="catalog-booking-action">
        <strong className="catalog-price">{formatMoney(activity.priceCents, activity.currency)}</strong>
        <Link
          className="liquid-ice-button portal-button"
          href={
            simulationId ? `${simulationPath(simulationId)}/activite/${activity.id}` : `/${data.slug}/${activity.id}`
          }
        >
          {activity.reservationsOpen === false ? PLAN_UI.VIEW_ONLY : SHARE_UI.CATALOG_OPEN}
        </Link>
      </div>
    </>
  );
  return data.hasBackground ? (
    <StoryPanel
      as="article"
      className="portal-organization-card ice-catalog-card catalog-activity"
      tone={data.storyTextTone ?? 'WHITE'}
      photoUrl={`/api/branding/${data.organizationId}/background`}
    >
      {content}
    </StoryPanel>
  ) : (
    <article className="portal-panel portal-organization-card catalog-activity">{content}</article>
  );
}
