'use client';
import { simulationPath } from '../../config/simulation';
import { ColorScene } from '../_ui/ColorScene';
import { AppLink as Link } from '../_ui/AppLink';
import { FORM_LABELS, BOOKING_STATUS_LABELS } from '../../config/constants';
import { PARTICIPANT_UI } from '../../config/constants';
import { useManagement } from './use-management';
import { ProofUpload } from './ProofUpload';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { ParticipantTicket } from './ParticipantTicket';
import { ParticipantDetails } from './ParticipantDetails';
export function ManageBooking({
  simulationId,
  testParticipant = false,
}: {
  readonly simulationId?: string;
  readonly testParticipant?: boolean;
} = {}) {
  const state = useManagement(simulationId, testParticipant);
  const booking = state.context;
  return (
    <div className="ice-widget-root manage-container">
      {booking?.participantHue != null ? <ColorScene hue={booking.participantHue} /> : null}
      <ManageBack booking={booking} simulationId={simulationId} testParticipant={testParticipant} />
      <section className="ice-cube-shell manage-shell">
        <h1>{FORM_LABELS.MANAGE}</h1>
        {booking ? <BookingSummary booking={booking} /> : null}
        {booking ? <ParticipantTicket booking={booking} /> : null}
        {booking ? (
          <ParticipantDetails
            booking={booking}
            simulationId={simulationId}
            testParticipant={testParticipant}
          />
        ) : null}
        <ContextFeedback state={state} />
        {booking?.hasProof && booking.status === 'PROOF_SUBMITTED' && !state.message ? (
          <p className="manage-note">{FORM_LABELS.PROOF_RECEIVED}</p>
        ) : null}
        {!simulationId && !testParticipant && booking?.canUploadProof && !state.cancelled ? (
          <ProofUpload submit={state.upload} pending={state.pending} />
        ) : null}
        {booking?.canCancel && !state.cancelled ? <CancelBooking state={state} /> : null}
        {state.message ? <p role="status">{state.message}</p> : null}
      </section>
    </div>
  );
}
function ManageBack({
  booking,
  simulationId,
  testParticipant,
}: {
  readonly booking: SelfBookingContext | null;
  readonly simulationId?: string;
  readonly testParticipant: boolean;
}) {
  const back = testParticipant
    ? '/connexion?acces=participant'
    : simulationId
      ? simulationPath(simulationId)
      : booking
        ? `/${booking.organizationSlug}/${booking.activityId}`
        : '/';
  const label = testParticipant
    ? PARTICIPANT_UI.BACK_LOGIN
    : booking
      ? FORM_LABELS.BACK_ACTIVITY
      : FORM_LABELS.BACK_HOME;
  return (
    <Link className="manage-back" href={back}>
      {label}
    </Link>
  );
}
function BookingSummary({ booking }: { readonly booking: SelfBookingContext }) {
  const date = new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: booking.timezone,
  }).format(new Date(booking.startsAtIso));
  return (
    <div className="manage-summary">
      <strong>{booking.activityName}</strong>
      <span>{date}</span>
      <span>{BOOKING_STATUS_LABELS[booking.status]}</span>
    </div>
  );
}
function CancelBooking({ state }: { readonly state: ReturnType<typeof useManagement> }) {
  return (
    <details className="manage-cancel">
      <summary>{FORM_LABELS.CANCEL_HEADING}</summary>
      <form onSubmit={state.cancel}>
        <label className="ice-check">
          <input type="checkbox" required />
          {FORM_LABELS.CONFIRM_CANCEL}
        </label>
        <button className="liquid-ice-button" disabled={state.pending}>
          {FORM_LABELS.CANCEL}
        </button>
      </form>
    </details>
  );
}

function ContextFeedback({ state }: { readonly state: ReturnType<typeof useManagement> }) {
  if (state.invalid)
    return (
      <div>
        <p role="alert">{FORM_LABELS.LINK_INVALID}</p>
        <Link href="/connexion?acces=participant">{PARTICIPANT_UI.LOGIN}</Link>
      </div>
    );
  if (!state.context && !state.unavailable) return <p role="status">{PARTICIPANT_UI.LOADING}</p>;
  if (!state.unavailable) return null;
  return (
    <div>
      <p role="alert">{FORM_LABELS.CONTEXT_UNAVAILABLE}</p>
      <button type="button" className="liquid-ice-button" onClick={state.refresh}>
        {FORM_LABELS.RETRY}
      </button>
    </div>
  );
}
