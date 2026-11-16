'use client';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI } from '../../config/constants';
import { useTicketDownload } from './use-ticket-download';
export function TicketDownload({ booking }: { readonly booking: SelfBookingContext }) {
  const pdf = useTicketDownload(booking);
  return (
    <>
      {pdf.url ? (
        <a className="liquid-ice-button" href={pdf.url} download={pdf.filename}>
          {UI.PDF_RETRY}
        </a>
      ) : (
        <button
          type="button"
          className="liquid-ice-button"
          disabled={pdf.pending}
          onClick={() => void pdf.prepare()}
        >
          {pdf.pending ? UI.PDF_PENDING : UI.DOWNLOAD}
        </button>
      )}
      {pdf.url ? (
        <p className="ticket-private" role="status">
          {UI.PDF_READY}
        </p>
      ) : null}
      {pdf.message ? <p role="alert">{UI.PDF_ERROR}</p> : null}
    </>
  );
}
