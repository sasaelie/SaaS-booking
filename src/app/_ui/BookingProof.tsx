'use client';
import { useBookingContext } from '../manage/use-booking-context';
import { ParticipantTicket } from '../manage/ParticipantTicket';
import { simulationApi } from '../../config/simulation';
import { useEffect } from 'react';
import { BOOKING_STATUSES } from '../../config/constants';
import { FORM_LABELS } from '../../config/constants';
export function BookingProof({
  token,
  simulationId,
  onConfirmed,
}: {
  readonly token: string;
  readonly simulationId?: string;
  readonly onConfirmed?: () => void;
}) {
  const state = useBookingContext(
    token,
    simulationId ? simulationApi(simulationId, 'context') : undefined,
  );
  useEffect(() => {
    if (state.context?.status === BOOKING_STATUSES.CONFIRMED) onConfirmed?.();
  }, [state.context?.status, onConfirmed]);
  if (state.unavailable) return <ProofRetry refresh={state.refresh} />;
  return state.context?.ticket ? (
    <div className="inline-booking-proof">
      <ParticipantTicket booking={state.context} />
    </div>
  ) : null;
}
function ProofRetry({ refresh }: { readonly refresh: () => void }) {
  return (
    <div className="inline-booking-proof">
      <p role="alert">{FORM_LABELS.CONTEXT_UNAVAILABLE}</p>
      <button type="button" className="home-secondary-link" onClick={refresh}>
        {FORM_LABELS.RETRY}
      </button>
    </div>
  );
}
