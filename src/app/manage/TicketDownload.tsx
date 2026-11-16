'use client';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI, FORM_LABELS } from '../../config/constants';
import { useTicketDownload } from './use-ticket-download';
export function TicketDownload({ booking }: { readonly booking: SelfBookingContext }) {
  const pdf = useTicketDownload(booking);
  return (
    <>
      {pdf.url ? (
        <a className="liquid-ice-button" href={pdf.url} download={pdf.filename}>
          {UI.SAVE}
        </a>
      ) : (
        <button
          type="button"
          className="liquid-ice-button"
          disabled={pdf.pending}
          onClick={pdf.retry}
        >
          {pdf.pending ? UI.PDF_PENDING : FORM_LABELS.RETRY}
        </button>
      )}
      {pdf.error ? <p role="alert">{UI.PDF_ERROR}</p> : null}
    </>
  );
}
