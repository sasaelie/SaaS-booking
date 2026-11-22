import type { z } from 'zod';
import { CreateBookingInputSchema } from '../domain/booking-validation';
import { PUBLIC_TEST } from '../../config/public-test';
export function publicTestBooking(raw: unknown, organizationId?: string) {
  const parsed = CreateBookingInputSchema.safeParse(raw);
  if (!parsed.success || (organizationId && parsed.data.organizationId !== organizationId))
    return null;
  return syntheticBooking(parsed.data);
}
function syntheticBooking(input: z.infer<typeof CreateBookingInputSchema>) {
  return {
    ...input,
    firstName: PUBLIC_TEST.FIRST_NAME,
    lastName: PUBLIC_TEST.LAST_NAME,
    email: PUBLIC_TEST.EMAIL,
    phone: PUBLIC_TEST.PHONE,
    marketingOptIn: false,
  };
}
