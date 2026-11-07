'use client';
import { useState, useRef, type FormEvent } from 'react';
import { createBookingAction, type BookingActionState } from '../actions/booking.actions';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { bookingFormInput } from './booking-form-input';
import { UI_MESSAGES } from '../../config/constants';
export function useBookingForm(data: BookingPageData) {
  const [selected, setSelected] = useState('');
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<BookingActionState | null>(null);
  const request = useRef({ fingerprint: '', key: '' });
  const inFlight = useRef(false);
  const selectedIso =
    data.slots.find((slot) => slot.startsAtIso === selected && slot.isBookable)?.startsAtIso ??
    data.slots.find((slot) => slot.isBookable)?.startsAtIso ??
    '';
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (inFlight.current || !selectedIso) return;
    inFlight.current = true;
    setPending(true);
    const input = bookingFormInput(event.currentTarget, data, '');
    const fingerprint = JSON.stringify(input);
    if (request.current.fingerprint !== fingerprint)
      request.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const result = await createBookingAction({
        ...input,
        idempotencyKey: request.current.key,
      });
      setState(result);
      if (result.booking?.checkoutUrl) window.location.assign(result.booking.checkoutUrl);
    } catch {
      setState({ success: false, message: UI_MESSAGES.FAILURE });
    } finally {
      setPending(false);
      inFlight.current = false;
    }
  }
  return { selectedIso, setSelected, pending, state, submit };
}
