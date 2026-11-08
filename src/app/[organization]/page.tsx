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
}: {
  readonly params: Promise<{ organization: string }>;
}) {
  const { organization } = await params;
  const service = publicCatalog();
  if (!service.ok)
    return (
      <main>
        <PortalError />
      </main>
    );
  const result = await service.value.execute(organization);
  if (!result.ok)
    return (
      <main>
        <PortalError />
      </main>
    );
  const data = result.value;
  return (
    <main className="participant-page">
      <BookingBrand
        name={data.name}
        logoUrl={data.hasLogo ? `/api/branding/${data.organizationId}/logo` : null}
      />
      <PortalHeading title={SHARE_UI.CATALOG_TITLE} />
      {!data.activities.length ? <PortalEmpty title={SHARE_UI.CATALOG_EMPTY} /> : null}
      <CatalogActivities data={data} />
    </main>
  );
}

function CatalogActivities({ data }: { readonly data: PublicCatalog }) {
  return (
    <div className="portal-cards">
      {data.activities.map((activity) => (
        <article key={activity.id} className="portal-panel portal-organization-card">
          <span className="portal-badge">{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
          <h2>{activity.name}</h2>
          {activity.description ? <p className="portal-muted">{activity.description}</p> : null}
          <strong>{formatMoney(activity.priceCents, activity.currency)}</strong>
          <Link className="liquid-ice-button portal-button" href={`/${data.slug}/${activity.id}`}>
            {SHARE_UI.CATALOG_OPEN}
          </Link>
        </article>
      ))}
    </div>
  );
}
