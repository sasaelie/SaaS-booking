import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { simulation } from '../../../composition/simulation';
import { CatalogContent } from '../../_ui/CatalogContent';
export default async function Page({ params }: { readonly params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const app = await simulation(await headers(), organizationId, true);
  if (!app.ok) notFound();
  const data = await app.value.catalog.execute(app.value.organization.slug);
  if (!data.ok) notFound();
  return <CatalogContent data={data.value} simulationId={organizationId} />;
}
