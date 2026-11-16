'use client';
import { useState } from 'react';
import type { ParticipantTicket } from '../../core/validation/participant';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI } from '../../config/constants';
import { TicketDownload } from './TicketDownload';
export function TicketAccess({
  ticket,
  booking,
}: {
  readonly ticket: ParticipantTicket;
  readonly booking: SelfBookingContext;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(ticket.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <img
        className="ticket-qr"
        src={ticket.qrDataUrl}
        alt="QR code pour ouvrir votre espace de réservation"
      />
      <label className="ticket-code">
        {UI.CODE}
        <textarea value={ticket.code} readOnly spellCheck={false} />
      </label>
      <p className="ticket-private">{UI.PRIVATE}</p>
      <div className="ticket-actions no-print">
        <button type="button" className="liquid-ice-button" onClick={() => void copy()}>
          {copied ? UI.COPIED : UI.COPY}
        </button>
        <TicketDownload key={JSON.stringify(booking)} booking={booking} />
      </div>
    </>
  );
}
