'use server';
import { headers } from 'next/headers';
import { runtime } from '../../composition/runtime';
import {
  BOOKING_STATUSES,
  BOOKING_UI,
  ERROR_CODES,
  UI_MESSAGES,
  type ErrorCode,
} from '../../config/constants';
import type { CreateBookingOutput } from '../../core/use-cases/create-booking.use-case';
export interface BookingActionState {
  readonly success: boolean;
  readonly message: string;
  readonly booking?: CreateBookingOutput;
  readonly code?: ErrorCode;
}
export async function createBookingAction(raw: unknown): Promise<BookingActionState> {
  const result = runtime();
  if (!result.ok) return { success: false, message: UI_MESSAGES.UNAVAILABLE };
  const requestHeaders = await headers();
  const limit = await result.value.limiter.accept(
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local',
  );
  if (!limit.ok) return { success: false, message: UI_MESSAGES.FAILURE };
  const booked = await result.value.createBooking.execute(raw);
  return booked.ok
    ? { success: true, message: bookingSuccessMessage(booked.value), booking: booked.value }
    : {
        success: false,
        message: bookingFailureMessage(booked.error.code),
        code: booked.error.code,
      };
}

function bookingSuccessMessage(booking: CreateBookingOutput): string {
  if (booking.status === BOOKING_STATUSES.CONFIRMED) return UI_MESSAGES.SUCCESS;
  return booking.bankInstructions ? BOOKING_UI.BANK_MESSAGE : BOOKING_UI.REDIRECT;
}
function bookingFailureMessage(code: ErrorCode): string {
  if (code === ERROR_CODES.SESSION_FULL || code === ERROR_CODES.SESSION_CLOSED_OR_PAUSED)
    return UI_MESSAGES.FULL;
  if (code === ERROR_CODES.TERMS_NOT_ACCEPTED) return UI_MESSAGES.TERMS_CHANGED;
  if (code === ERROR_CODES.MINOR_EMERGENCY_PHONE_REQUIRED) return BOOKING_UI.ERROR_PHONE;
  if (code === ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED) return BOOKING_UI.ERROR_VOUCHER;
  if (code === ERROR_CODES.VALIDATION_FAILED) return BOOKING_UI.ERROR_VALIDATION;
  return UI_MESSAGES.FAILURE;
}
