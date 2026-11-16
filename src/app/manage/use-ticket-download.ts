'use client';
import { useEffect, useState } from 'react';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_PDF as PDF } from '../../config/participant-pdf';
import { PARTICIPANT_UI as UI } from '../../config/constants';
import { useMutation } from '../_portal/use-mutation';
export function useTicketDownload(booking: SelfBookingContext) {
  const state = useMutation();
  const [url, setUrl] = useState<string | null>(null);
  const filename = booking.ticket?.isSimulation ? PDF.TEST_FILENAME : PDF.FILENAME;
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  function prepare() {
    return state.run(async () => {
      const { participantTicketPdf } = await import('../../composition/participant-ticket-pdf');
      const result = await participantTicketPdf().execute(booking);
      if (!result.ok) {
        state.setMessage(UI.PDF_ERROR);
        return;
      }
      const file = new Blob([new Uint8Array(result.value).buffer], { type: PDF.MIME });
      const next = URL.createObjectURL(file);
      setUrl(next);
      const link = document.createElement('a');
      link.href = next;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
    });
  }
  return { url, filename, prepare, pending: state.pending, message: state.message };
}
