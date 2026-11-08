'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { useBookingForm } from './use-booking-form';
import { useVoucherQuote } from './use-voucher-quote';
export function useBookingFlow(data: BookingPageData) {
  const form = useBookingForm(data);
  const quote = useVoucherQuote(data);
  const [details, setDetails] = useState(false);
  const sessionHeading = useRef<HTMLHeadingElement>(null);
  const contactHeading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  useEffect(() => {
    if (navigated.current) (details ? contactHeading : sessionHeading).current?.focus();
  }, [details]);
  function navigate(value: boolean) {
    if (form.pending || form.state?.success || (value && !form.selectedIso)) return;
    navigated.current = true;
    setDetails(value);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (!details || quote.pending || (quote.code.trim() && quote.remaining === null)) {
      event.preventDefault();
      return;
    }
    await form.submit(event);
  }
  return { data, form, quote, details, navigate, submit, sessionHeading, contactHeading };
}
export type BookingFlowState = ReturnType<typeof useBookingFlow>;
