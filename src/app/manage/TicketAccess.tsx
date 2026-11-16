'use client';
import { useId, useState } from 'react';
import type { ParticipantTicket } from '../../core/validation/participant';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI, PARTICIPANT } from '../../config/constants';
import { TicketDownload } from './TicketDownload';
export function TicketAccess({
  ticket,
  booking,
}: {
  readonly ticket: ParticipantTicket;
  readonly booking: SelfBookingContext;
}) {
  return (
    <>
      <img
        className="ticket-qr"
        src={ticket.qrDataUrl}
        alt="QR code pour ouvrir votre espace de réservation"
      />
      <TicketCode code={ticket.code} />
      <p className="ticket-private">{UI.PRIVATE}</p>
      <div className="ticket-actions no-print">
        <TicketDownload key={JSON.stringify(booking)} booking={booking} />
      </div>
    </>
  );
}
function TicketCode({ code }: { readonly code: string }) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="ticket-code">
      <div className="ticket-code-heading">
        <label htmlFor={id}>{UI.CODE}</label>
        <button type="button" className="ticket-copy-button no-print" onClick={() => void copy()}>
          {copied ? UI.COPIED : UI.COPY}
        </button>
      </div>
      <textarea
        id={id}
        value={code}
        readOnly
        spellCheck={false}
        rows={PARTICIPANT.CODE_DISPLAY_ROWS}
      />
      <span className="ice-sr-only" role="status">
        {copied ? UI.COPIED : ''}
      </span>
    </div>
  );
}
