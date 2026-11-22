import type { BookingActionState } from '../actions/booking.actions';
import { BOOKING_STATUSES, UI_MESSAGES } from '../../config/constants';
export function bookingResultState(
  state: BookingActionState | null,
  cancelled: boolean,
  paid: boolean,
) {
  if (!state?.success || !state.booking) return state;
  if (cancelled)
    return {
      ...state,
      message: UI_MESSAGES.CANCEL_SUCCESS,
      booking: { ...state.booking, status: BOOKING_STATUSES.CANCELLED_BY_ATTENDEE },
    };
  if (!paid || !state.booking.checkoutUrl) return state;
  return {
    ...state,
    message: UI_MESSAGES.SUCCESS,
    booking: { ...state.booking, status: BOOKING_STATUSES.CONFIRMED, checkoutUrl: null },
  };
}
