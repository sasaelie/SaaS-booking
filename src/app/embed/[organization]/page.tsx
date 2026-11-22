import { notFound } from 'next/navigation';
import { publicCatalog } from '../../../composition/public-catalog';
import { UI_MESSAGES } from '../../../config/constants';
import { CatalogContent } from '../../_ui/CatalogContent';
import { EmbedHeightReporter } from '../../_ui/EmbedHeightReporter';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organization: string }>;
}) {
  const { organization } = await params;
  const service = publicCatalog();
  const result = service.ok ? await service.value.execute(organization) : null;
  if (result && !result.ok && result.error.code === 'NOT_FOUND') notFound();
  return (
    <main className="booking-embed">
      {result?.ok && result.value.showPlatformSignature === false ? (
        <CatalogContent data={result.value} embedded />
      ) : (
        <p>{UI_MESSAGES.UNAVAILABLE}</p>
      )}
      <EmbedHeightReporter
        available={Boolean(result?.ok && result.value.showPlatformSignature === false)}
      />
    </main>
  );
}
