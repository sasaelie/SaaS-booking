'use client';
import { simulationPath } from '../../config/simulation';
import { ColorScene } from '../_ui/ColorScene';
import { AppLink as Link } from '../_ui/AppLink';
import { FORM_LABELS, BOOKING_STATUS_LABELS, BOOKING_STATUSES } from '../../config/constants';
import { PARTICIPANT_UI } from '../../config/constants';
import { useManagement } from './use-management';
import { ProofUpload } from './ProofUpload';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { ParticipantTicket } from './ParticipantTicket';
import { ParticipantDetails } from './ParticipantDetails';
import { EMBED } from '../../config/constants';
type InlineManagement = {
  readonly token: string;
  readonly onBack: (booking: SelfBookingContext | null) => void;
};
type ManagementProps = {
  readonly simulationId?: string;
  readonly testParticipant?: boolean;
  readonly inline?: InlineManagement;
};
export function ManageBooking({
  simulationId,
  testParticipant = false,
  inline,
}: ManagementProps = {}) {
  const state = useManagement(simulationId, testParticipant, inline?.token);
  const booking: SelfBookingContext | null =
    state.cancelled && state.context
      ? { ...state.context, status: BOOKING_STATUSES.CANCELLED_BY_ATTENDEE }
      : state.context;
  return (
    <div className="ice-widget-root manage-container">
      {!inline && booking?.participantHue != null ? (
        <ColorScene hue={booking.participantHue} />
      ) : null}
      <ManageBack
        booking={booking}
        simulationId={simulationId}
        testParticipant={testParticipant}
        inline={inline}
      />
      <ManageContent
        state={state}
        simulationId={simulationId}
        testParticipant={testParticipant}
        inline={inline}
      />
    </div>
  );
}
function ManageContent({
  state,
  simulationId,
  testParticipant,
  inline,
}: ManagementProps & {
  readonly state: ReturnType<typeof useManagement>;
}) {
  const booking = state.context;
  return (
    <section
      className={inline ? 'manage-shell embedded-manage-shell' : 'ice-cube-shell manage-shell'}
    >
      <h1>{FORM_LABELS.MANAGE}</h1>
      {booking && !booking.ticket ? <BookingSummary booking={booking} /> : null}
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
  );
}
function ManageBack({
  booking,
  simulationId,
  testParticipant,
  inline,
}: ManagementProps & {
  readonly booking: SelfBookingContext | null;
}) {
  if (inline)
    return (
      <button
        type="button"
        className="manage-back home-secondary-link"
        onClick={() => inline.onBack(booking)}
      >
        {EMBED.RETURN_TICKET}
      </button>
    );
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
