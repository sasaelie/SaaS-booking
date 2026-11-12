import { publicCatalog } from '../../composition/public-catalog';
import { ParticipantNavigation } from '../_ui/ParticipantNavigation';
import { CatalogContent } from '../_ui/CatalogContent';
import { PortalError } from '../_portal/PortalError';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { simulation } from '../../composition/simulation';
import { simulationPath } from '../../config/simulation';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
  searchParams,
}: {
  readonly params: Promise<{ organization: string }>;
  readonly searchParams: Promise<{ from?: string }>;
}) {
  const { organization } = await params;
  const { from } = await searchParams;
  const service = publicCatalog();
  if (!service.ok)
    return (
      <main>
        <PortalError />
      </main>
    );
  const data = await service.value.execute(organization);
  if (!data.ok)
    return (
      <main>
        <PortalError />
      </main>
    );
  if (from === 'appearance') {
    const own = await simulation(await headers(), data.value.organizationId);
    if (!own.ok) notFound();
    redirect(simulationPath(data.value.organizationId));
  }
  return (
    <main className="participant-page">
      <ParticipantNavigation organizationId={data.value.organizationId} slug={organization} catalog />
      <CatalogContent data={data.value} />
    </main>
  );
}
