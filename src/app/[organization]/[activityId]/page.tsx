import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { simulation } from '../../../composition/simulation';
import { simulationPath } from '../../../config/simulation';
import { editableTermsUrl } from '../../../composition/editable-terms';
import { ParticipantNavigation } from '../../_ui/ParticipantNavigation';
import { runtime } from '../../../composition/runtime';
import { IceBookingWidget } from '../../_ui/IceBookingWidget';
import { UI_MESSAGES } from '../../../config/constants';
import { INTERFACE_QUALITY as UI } from '../../../config/interface-quality';
import { PortalError } from '../../_portal/PortalError';
export const dynamic = 'force-dynamic';
interface Props {
  readonly searchParams: Promise<{ from?: string }>;
  readonly params: Promise<{ organization: string; activityId: string }>;
}
export default async function ActivityPage({ params, searchParams }: Props) {
  const route = await params;
  const query = await searchParams;
  const app = runtime();
  if (!app.ok)
    return (
      <main>
        <PortalError message={UI_MESSAGES.UNAVAILABLE} href="/" label={UI.HOME} />
      </main>
    );
  const result = await app.value.bookingPage.execute({
    slug: route.organization,
    activityId: route.activityId,
  });
  if (result.ok) await redirectAppearance(query, route, result.value.organizationId);
  const edit = result.ok
    ? await editableTermsUrl(result.value.organizationId, route.activityId)
    : undefined;
  return (
    <main className="participant-page">
      {result.ok ? (
        <>
          <ParticipantNavigation
            organizationId={result.value.organizationId}
            slug={route.organization}
            from={query.from}
          />
          <IceBookingWidget
            key={result.value.activityId}
            data={{ ...result.value, termsEditUrl: edit }}
          />
        </>
      ) : (
        <PortalError message={UI_MESSAGES.UNAVAILABLE} href="/" label={UI.HOME} />
      )}
    </main>
  );
}

async function redirectAppearance(
  query: { from?: string },
  route: { activityId: string },
  organizationId: string,
) {
  if (query.from === 'appearance') {
    const own = await simulation(await headers(), organizationId);
    if (!own.ok) notFound();
    redirect(`${simulationPath(organizationId)}/activite/${route.activityId}`);
  }
}
