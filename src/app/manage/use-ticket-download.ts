'use client';
import { useEffect, useRef, useState } from 'react';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_PDF as PDF } from '../../config/participant-pdf';
import { prepareTicketFile } from './prepare-ticket-file';
export function useTicketDownload(booking: SelfBookingContext) {
  const snapshot = useRef(booking);
  const [attempt, setAttempt] = useState(0);
  const [file, setFile] = useState<{ url: string | null; error: boolean }>({
    url: null,
    error: false,
  });
  useEffect(() => {
    let cancelled = false;
    let resource: string | null = null;
    void prepareTicketFile(snapshot.current).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      resource = url;
      setFile({ url, error: !url });
    });
    return () => {
      cancelled = true;
      if (resource) URL.revokeObjectURL(resource);
    };
  }, [attempt]);
  function retry() {
    setFile({ url: null, error: false });
    setAttempt((value) => value + 1);
  }
  const filename = booking.ticket?.isSimulation ? PDF.TEST_FILENAME : PDF.FILENAME;
  return { ...file, filename, retry, pending: !file.url && !file.error };
}
