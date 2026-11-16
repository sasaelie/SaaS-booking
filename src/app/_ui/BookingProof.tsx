'use client';
import { useBookingContext } from '../manage/use-booking-context';
import { ParticipantTicket } from '../manage/ParticipantTicket';
import { simulationApi } from '../../config/simulation';
export function BookingProof({
  token,
  simulationId,
}: {
  readonly token: string;
  readonly simulationId?: string;
}) {
  const state = useBookingContext(
    token,
    simulationId ? simulationApi(simulationId, 'context') : undefined,
  );
  return state.context?.ticket ? (
    <div className="inline-booking-proof">
      <ParticipantTicket booking={state.context} />
    </div>
  ) : null;
}
