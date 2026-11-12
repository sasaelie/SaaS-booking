import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { simulation } from '../../../composition/simulation';
import { SimulationNotice } from '../../_simulation/SimulationNotice';
export const dynamic = 'force-dynamic';
export default async function Layout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const app = await simulation(await headers(), organizationId);
  if (!app.ok) notFound();
  return (
    <main className="participant-page">
      <SimulationNotice id={organizationId} />
      {children}
    </main>
  );
}
