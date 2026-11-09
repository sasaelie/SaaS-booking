import { ParticipantNavigation } from '../../_ui/ParticipantNavigation';
import { runtime } from '../../../composition/runtime';
import { IceBookingWidget } from '../../_ui/IceBookingWidget';
import { UI_MESSAGES } from '../../../config/constants';
export const dynamic = 'force-dynamic';
export default async function ActivityPage({
  params,
  searchParams,
}: {
  readonly searchParams: Promise<{ from?: string }>;
  readonly params: Promise<{ organization: string; activityId: string }>;
}) {
  const route = await params;
  const query = await searchParams;
  const app = runtime();
  if (!app.ok)
    return (
      <main>
        <p>{UI_MESSAGES.UNAVAILABLE}</p>
      </main>
    );
  const result = await app.value.bookingPage.execute({
    slug: route.organization,
    activityId: route.activityId,
  });
  return (
    <main className="participant-page">
      {result.ok ? (
        <>
          <ParticipantNavigation
            organizationId={result.value.organizationId}
            slug={route.organization}
            from={query.from}
          />
          <IceBookingWidget key={result.value.activityId} data={result.value} />
        </>
      ) : (
        <p>{UI_MESSAGES.UNAVAILABLE}</p>
      )}
    </main>
  );
}
