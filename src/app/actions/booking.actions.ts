'use server';
import { headers } from 'next/headers';
import { runtime } from '../../composition/runtime';
import { UI_MESSAGES } from '../../config/constants';
import type { CreateBookingOutput } from '../../core/use-cases/create-booking.use-case';
export interface BookingActionState {
  readonly success: boolean;
  readonly message: string;
  readonly booking?: CreateBookingOutput;
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
    ? { success: true, message: UI_MESSAGES.SUCCESS, booking: booked.value }
    : { success: false, message: UI_MESSAGES.FAILURE };
}
