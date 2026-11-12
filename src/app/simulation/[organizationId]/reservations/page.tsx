import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { simulation } from '../../../../composition/simulation';
import { SimulationBookings } from '../../../_simulation/SimulationBookings';
export default async function Page({ params }: { readonly params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const app = await simulation(await headers(), organizationId);
  if (!app.ok) notFound();
  const list = await app.value.tests.list();
  if (!list.ok) notFound();
  return <SimulationBookings id={organizationId} bookings={list.value} />;
}
