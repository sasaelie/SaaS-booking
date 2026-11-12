import { headers } from 'next/headers';
import { simulation } from '../../../../../composition/simulation';
import { SimulationBookings } from '../../../../_simulation/SimulationBookings';
import { PortalError } from '../../../../_portal/PortalError';
import { SIMULATION } from '../../../../../config/simulation';
export default async function Page({ params }: { readonly params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const app = await simulation(await headers(), organizationId);
  if (!app.ok) return <PortalError />;
  const list = await app.value.tests.list();
  if (!list.ok) return <PortalError />;
  return (
    <>
      <p className="portal-notice">{SIMULATION.NOTE}</p>
      <SimulationBookings id={organizationId} bookings={list.value} />
    </>
  );
}
