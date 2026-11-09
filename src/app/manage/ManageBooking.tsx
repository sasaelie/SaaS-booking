'use client';
import { ColorScene } from '../_ui/ColorScene';
import Link from 'next/link';
import { FORM_LABELS, BOOKING_STATUS_LABELS } from '../../config/constants';
import { useManagement } from './use-management';
import { ProofUpload } from './ProofUpload';
import type { SelfBookingContext } from '../../core/validation/self-booking';
export function ManageBooking() {
  const state = useManagement();
  const booking = state.context;
  const back = booking ? `/${booking.organizationSlug}/${booking.activityId}` : '/';
  return (
    <div className="ice-widget-root manage-container">
      {booking?.participantHue != null ? <ColorScene hue={booking.participantHue} /> : null}
      <Link className="manage-back" href={back}>
        {booking ? FORM_LABELS.BACK_ACTIVITY : FORM_LABELS.BACK_HOME}
      </Link>
      <section className="ice-cube-shell manage-shell">
        <h1>{FORM_LABELS.MANAGE}</h1>
        {booking ? <BookingSummary booking={booking} /> : null}
        <ContextFeedback state={state} />
        {booking?.hasProof && booking.status === 'PROOF_SUBMITTED' && !state.message ? (
          <p className="manage-note">{FORM_LABELS.PROOF_RECEIVED}</p>
        ) : null}
        {booking?.canUploadProof && !state.cancelled ? (
          <ProofUpload submit={state.upload} pending={state.pending} />
        ) : null}
        {booking?.canCancel && !state.cancelled ? <CancelBooking state={state} /> : null}
        {state.message ? <p role="status">{state.message}</p> : null}
      </section>
    </div>
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
  if (state.invalid) return <p role="alert">{FORM_LABELS.LINK_INVALID}</p>;
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
