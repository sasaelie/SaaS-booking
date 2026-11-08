import type { FormEvent } from 'react';
import { createBookingAction, type BookingActionState } from '../actions/booking.actions';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { bookingFormInput } from './booking-form-input';
import { ERROR_CODES, UI_MESSAGES } from '../../config/constants';
interface SubmissionContext {
  readonly data: BookingPageData;
  readonly selectedIso: string;
  readonly request: { current: { fingerprint: string; key: string } };
  readonly inFlight: { current: boolean };
  readonly setPending: (value: boolean) => void;
  readonly setState: (value: BookingActionState | null) => void;
  readonly refresh: () => void;
}
export async function submitBooking(event: FormEvent<HTMLFormElement>, state: SubmissionContext) {
  event.preventDefault();
  if (state.inFlight.current || !state.selectedIso) return;
  state.inFlight.current = true;
  state.setPending(true);
  const input = bookingFormInput(event.currentTarget, state.data, '');
  const fingerprint = JSON.stringify(input);
  if (state.request.current.fingerprint !== fingerprint)
    state.request.current = { fingerprint, key: crypto.randomUUID() };
  try {
    const result = await createBookingAction({
      ...input,
      idempotencyKey: state.request.current.key,
    });
    state.setState(result);
    if (
      !result.success &&
      (result.code === ERROR_CODES.SESSION_FULL || result.code === ERROR_CODES.TERMS_NOT_ACCEPTED)
    )
      state.refresh();
    if (result.booking?.checkoutUrl) window.location.assign(result.booking.checkoutUrl);
  } catch {
    state.setState({ success: false, message: UI_MESSAGES.FAILURE });
  } finally {
    state.setPending(false);
    state.inFlight.current = false;
  }
}
