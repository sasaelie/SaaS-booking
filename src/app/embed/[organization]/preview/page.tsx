import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { websitePreview } from '../../../../composition/website-preview';
import { CatalogContent } from '../../../_ui/CatalogContent';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organization: string }>;
}) {
  const { organization } = await params;
  const app = await websitePreview(await headers(), organization, true);
  if (!app.ok) notFound();
  const data = await app.value.catalog.execute(organization);
  if (!data.ok) notFound();
  return <CatalogContent data={data.value} simulationId={app.value.organization.id} embedded />;
}
