import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { simulation } from '../../../../../composition/simulation';
import { SimulationPayment } from '../../../../_simulation/SimulationPayment';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organizationId: string; bookingId: string }>;
}) {
  const { organizationId, bookingId } = await params;
  const app = await simulation(await headers(), organizationId);
  if (!app.ok || !(await app.value.repository.visible(bookingId)).ok) notFound();
  return <SimulationPayment id={organizationId} bookingId={bookingId} />;
}
