import { runtime } from '../../../composition/runtime';
import { IceBookingWidget } from '../../_ui/IceBookingWidget';
import { UI_MESSAGES } from '../../../config/constants';
export const dynamic = 'force-dynamic';
export default async function ActivityPage({
  params,
}: {
  readonly params: Promise<{ organization: string; activityId: string }>;
}) {
  const route = await params;
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
    <main>
      {result.ok ? <IceBookingWidget data={result.value} /> : <p>{UI_MESSAGES.UNAVAILABLE}</p>}
    </main>
  );
}
