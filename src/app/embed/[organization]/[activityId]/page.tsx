import { runtime } from '../../../../composition/runtime';
import { UI_MESSAGES } from '../../../../config/constants';
import { IceBookingWidget } from '../../../_ui/IceBookingWidget';
import { EmbedHeightReporter } from '../../../_ui/EmbedHeightReporter';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organization: string; activityId: string }>;
}) {
  const route = await params;
  const app = runtime();
  if (!app.ok)
    return (
      <main className="booking-embed">
        <p>{UI_MESSAGES.UNAVAILABLE}</p>
        <EmbedHeightReporter />
      </main>
    );
  const result = await app.value.bookingPage.execute({
    slug: route.organization,
    activityId: route.activityId,
  });
  return (
    <main className="booking-embed">
      {result.ok ? <IceBookingWidget data={result.value} /> : <p>{UI_MESSAGES.UNAVAILABLE}</p>}
      <EmbedHeightReporter />
    </main>
  );
}
