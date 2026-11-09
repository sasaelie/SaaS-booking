import { StoryPanel } from '../_ui/StoryPanel';
import { ParticipantNavigation } from '../_ui/ParticipantNavigation';
import { PARTICIPANT_NAV } from '../../config/participant-navigation';
import { ColorScene } from '../_ui/ColorScene';
import type { PublicCatalog } from '../../core/ports/public-catalog.port';
import Link from 'next/link';
import { publicCatalog } from '../../composition/public-catalog';
import { SHARE_UI, AUDIENCE_LABELS } from '../../config/constants';
import { BookingBrand } from '../_ui/BookingBrand';
import { formatMoney } from '../_ui/format-money';
import { PortalError } from '../_portal/PortalError';
import { PortalHeading } from '../_portal/PortalHeading';
import { PortalEmpty } from '../_portal/PortalEmpty';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
  searchParams,
}: {
  readonly searchParams: Promise<{ from?: string }>;
  readonly params: Promise<{ organization: string }>;
}) {
  const { organization } = await params;
  const { from } = await searchParams;
  const service = publicCatalog();
  if (!service.ok) return <CatalogError />;
  const result = await service.value.execute(organization);
  if (!result.ok) return <CatalogError />;
  const data = result.value;
  return (
    <main className="participant-page ice-branded-page">
      {data.participantHue != null ? <ColorScene hue={data.participantHue} /> : null}
      <ParticipantNavigation
        organizationId={data.organizationId}
        slug={data.slug}
        from={from}
        catalog
      />
      <BookingBrand
        name={data.name}
        logoUrl={data.hasLogo ? `/api/branding/${data.organizationId}/logo` : null}
      />
      <PortalHeading title={SHARE_UI.CATALOG_TITLE} />
      {!data.activities.length ? <PortalEmpty title={SHARE_UI.CATALOG_EMPTY} /> : null}
      <CatalogActivities data={data} from={from} />
    </main>
  );
}

function CatalogActivities({
  data,
  from,
}: {
  readonly data: PublicCatalog;
  readonly from?: string;
}) {
  return (
    <div className="portal-cards">
      {data.activities.map((activity) => (
        <CatalogCard key={activity.id} data={data} activity={activity} from={from} />
      ))}
    </div>
  );
}
function CatalogCard({
  data,
  activity,
  from,
}: {
  readonly data: PublicCatalog;
  readonly activity: PublicCatalog['activities'][number];
  readonly from?: string;
}) {
  const content = (
    <>
      <span className="portal-badge">{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
      <h2>{activity.name}</h2>
      {activity.description ? <p className="portal-muted">{activity.description}</p> : null}
      <strong>{formatMoney(activity.priceCents, activity.currency)}</strong>
      <Link
        className="liquid-ice-button portal-button"
        href={`/${data.slug}/${activity.id}${from === PARTICIPANT_NAV.SOURCE ? '?from=appearance' : ''}`}
      >
        {SHARE_UI.CATALOG_OPEN}
      </Link>
    </>
  );
  return data.hasBackground ? (
    <StoryPanel
      as="article"
      className="portal-organization-card ice-catalog-card"
      tone={data.storyTextTone ?? 'WHITE'}
      photoUrl={`/api/branding/${data.organizationId}/background`}
    >
      {content}
    </StoryPanel>
  ) : (
    <article className="portal-panel portal-organization-card">{content}</article>
  );
}

function CatalogError() {
  return (
    <main>
      <PortalError />
    </main>
  );
}
