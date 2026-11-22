import { AppLink as Link } from './AppLink';
import type { PublicCatalog } from '../../core/ports/public-catalog.port';
import { SHARE_UI, AUDIENCE_LABELS } from '../../config/constants';
import { PLAN_UI } from '../../config/commercial';
import { simulationPath } from '../../config/simulation';
import { websitePreviewPath } from '../../config/website-preview';
import { StoryPanel } from './StoryPanel';
import { ColorScene } from './ColorScene';
import { BookingBrand } from './BookingBrand';
import { SocialLinks } from './SocialLinks';
import { PlatformSignature } from './PlatformSignature';
import { PortalHeading } from '../_portal/PortalHeading';
import { PortalEmpty } from '../_portal/PortalEmpty';
import { formatMoney } from './format-money';
import { StoryCanvas } from './StoryCanvas';
import { CATALOG_LAYOUT } from '../../config/catalog-layout';
export function CatalogContent({
  data,
  simulationId,
  embedded = false,
}: {
  readonly data: PublicCatalog;
  readonly simulationId?: string;
  readonly embedded?: boolean;
}) {
  return (
    <div className="ice-branded-page participant-catalog">
      {data.participantHue != null ? <ColorScene hue={data.participantHue} /> : null}
      <div className="catalog-identity">
        <BookingBrand
          name={data.name}
          logoUrl={data.hasLogo ? `/api/branding/${data.organizationId}/logo` : null}
        />
        <SocialLinks links={data.socialLinks} />
      </div>
      <PortalHeading title={SHARE_UI.CATALOG_TITLE} />
      {!data.activities.length ? <PortalEmpty title={SHARE_UI.CATALOG_EMPTY} /> : null}
      <CatalogActivities data={data} simulationId={simulationId} embedded={embedded} />
      {data.showPlatformSignature ? <PlatformSignature /> : null}
    </div>
  );
}
function CatalogActivities({
  data,
  simulationId,
  embedded = false,
}: {
  readonly data: PublicCatalog;
  readonly simulationId?: string;
  readonly embedded?: boolean;
}) {
  const compact = data.activities.length > 1;
  return (
    <div className="catalog-layout">
      <div
        className="portal-cards catalog-grid"
        data-density={compact ? 'compact' : 'poster'}
        data-columns={
          data.activities.length >= CATALOG_LAYOUT.THREE_COLUMN_MIN_ACTIVITIES ? 'three' : 'two'
        }
      >
        {data.activities.map((activity) => (
          <CatalogCard
            key={activity.id}
            data={data}
            activity={activity}
            simulationId={simulationId}
            embedded={embedded}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
interface CatalogCardProps {
  readonly compact: boolean;
  readonly data: PublicCatalog;
  readonly activity: PublicCatalog['activities'][number];
  readonly simulationId?: string;
  readonly embedded?: boolean;
}
function CatalogCard({ data, activity, simulationId, embedded, compact }: CatalogCardProps) {
  const content = (
    <>
      <span className="portal-badge">{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
      {data.storyLayout && !compact ? (
        <StoryCanvas
          layout={data.storyLayout}
          title={activity.name}
          price={formatMoney(activity.priceCents, activity.currency)}
        />
      ) : (
        <h2>{activity.name}</h2>
      )}
      {activity.description ? (
        <p className="portal-muted catalog-description">{activity.description}</p>
      ) : null}
      <div className="catalog-booking-action">
        {!data.storyLayout || compact ? (
          <strong className="catalog-price">
            {formatMoney(activity.priceCents, activity.currency)}
          </strong>
        ) : null}
        <Link
          className="liquid-ice-button portal-button"
          href={
            simulationId
              ? embedded
                ? websitePreviewPath(data.slug, activity.id)
                : `${simulationPath(simulationId)}/activite/${activity.id}`
              : `${embedded ? '/embed' : ''}/${data.slug}/${activity.id}`
          }
        >
          {activity.reservationsOpen === false ? PLAN_UI.VIEW_ONLY : SHARE_UI.CATALOG_OPEN}
        </Link>
      </div>
    </>
  );
  return <CatalogFrame data={data}>{content}</CatalogFrame>;
}
function CatalogFrame({
  data,
  children,
}: {
  readonly data: PublicCatalog;
  readonly children: import('react').ReactNode;
}) {
  return data.hasBackground ? (
    <StoryPanel
      as="article"
      className="portal-organization-card ice-catalog-card catalog-activity"
      tone={data.storyTextTone ?? 'WHITE'}
      photoUrl={`/api/branding/${data.organizationId}/background`}
    >
      {children}
    </StoryPanel>
  ) : (
    <article className="portal-panel portal-organization-card catalog-activity">{children}</article>
  );
}
