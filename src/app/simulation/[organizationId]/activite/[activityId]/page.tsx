import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { simulation } from '../../../../../composition/simulation';
import { IceBookingWidget } from '../../../../_ui/IceBookingWidget';
import Link from 'next/link';
import { SIMULATION, simulationPath } from '../../../../../config/simulation';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organizationId: string; activityId: string }>;
}) {
  const { organizationId, activityId } = await params;
  const app = await simulation(await headers(), organizationId, true);
  if (!app.ok) notFound();
  const data = await app.value.bookingPage.execute({
    slug: app.value.organization.slug,
    activityId,
  });
  if (!data.ok || data.value.organizationId !== organizationId) notFound();
  return (
    <>
      <Link className="portal-secondary-action" href={simulationPath(organizationId)}>
        {SIMULATION.RETURN_ACTIVITIES}
      </Link>
      <IceBookingWidget
        data={{
          ...data.value,
          simulationId: organizationId,
          termsEditUrl:
            app.value.organization.role === 'OWNER'
              ? `/app/${organizationId}/activites/${activityId}?edit=terms#activity-edit`
              : undefined,
        }}
      />
    </>
  );
}
