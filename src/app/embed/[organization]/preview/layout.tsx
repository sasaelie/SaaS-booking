import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { websitePreview } from '../../../../composition/website-preview';
import { EmbedHeightReporter } from '../../../_ui/EmbedHeightReporter';
import { SimulationNotice } from '../../../_simulation/SimulationNotice';
export const dynamic = 'force-dynamic';
export default async function Layout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ organization: string }>;
}) {
  const { organization } = await params;
  const app = await websitePreview(await headers(), organization);
  if (!app.ok) notFound();
  return (
    <main className="booking-embed website-preview-embed">
      <SimulationNotice id={app.value.organization.id} embedded />
      {children}
      <EmbedHeightReporter />
    </main>
  );
}
