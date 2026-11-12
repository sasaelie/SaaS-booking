'use server';
import { headers } from 'next/headers';
import { simulation } from '../../composition/simulation';
import type { BookingActionState } from './booking.actions';
import { UI_MESSAGES } from '../../config/constants';
import { SIMULATION } from '../../config/simulation';
export async function createSimulationBookingAction(id: string, raw: unknown): Promise<BookingActionState> {
  const app = await simulation(await headers(), id);
  if (!app.ok || !raw || typeof raw !== 'object' || !('organizationId' in raw) || raw.organizationId !== id)
    return { success: false, message: UI_MESSAGES.FAILURE };
  const result = await app.value.createBooking.execute(raw);
  return result.ok
    ? { success: true, message: SIMULATION.TITLE, booking: result.value }
    : { success: false, message: UI_MESSAGES.FAILURE, code: result.error.code };
}
