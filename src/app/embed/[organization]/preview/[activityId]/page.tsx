import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { websitePreview } from '../../../../../composition/website-preview';
import { websitePreviewPath } from '../../../../../config/website-preview';
import { SIMULATION } from '../../../../../config/simulation';
import { IceBookingWidget } from '../../../../_ui/IceBookingWidget';
import { AppLink } from '../../../../_ui/AppLink';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organization: string; activityId: string }>;
}) {
  const { organization, activityId } = await params;
  const app = await websitePreview(await headers(), organization, true);
  if (!app.ok) notFound();
  const data = await app.value.bookingPage.execute({ slug: organization, activityId });
  if (!data.ok || data.value.organizationId !== app.value.organization.id) notFound();
  return (
    <>
      <AppLink
        className="simulation-nav-link participant-return-link"
        href={websitePreviewPath(organization)}
      >
        {SIMULATION.RETURN_ACTIVITIES}
      </AppLink>
      <IceBookingWidget
        data={{ ...data.value, simulationId: app.value.organization.id }}
        embedded
      />
    </>
  );
}
