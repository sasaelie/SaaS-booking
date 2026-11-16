import { ManageBooking } from './ManageBooking';
import { PARTICIPANT } from '../../config/constants';
import { SIMULATION } from '../../config/simulation';
export const dynamic = 'force-dynamic';
export default async function ManagePage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const testParticipant = query[PARTICIPANT.TEST_QUERY] === PARTICIPANT.TEST_VALUE;
  return (
    <main className="participant-page">
      {testParticipant ? (
        <aside className="portal-notice simulation-notice" role="note">
          <strong>{SIMULATION.TITLE}</strong>
          <p>{SIMULATION.PREVIEW_NOTE}</p>
        </aside>
      ) : null}
      <ManageBooking testParticipant={testParticipant} />
    </main>
  );
}
