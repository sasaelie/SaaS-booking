// src/app/actions/booking.actions.ts
'use server';
import { CreateBookingUseCase } from '../../core/use-cases/create-booking.use-case';
import type { RawCreateBookingInput } from '../../core/domain/booking-validation';
export interface BookingActionState {
  readonly success: boolean;
  readonly message: string;
  readonly bookingId?: string;
  readonly checkoutUrl?: string;
}
export async function createBookingAction(
  prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const rawInput: RawCreateBookingInput = {
    organizationId: String(formData.get('organizationId') ?? ''),
    activityId: String(formData.get('activityId') ?? ''),
    startsAtIso: String(formData.get('startsAtIso') ?? ''),
    idempotencyKey: String(
      formData.get('idempotencyKey') ?? crypto.randomUUID(),
    ),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    marketingOptIn: formData.get('marketingOptIn') === 'true',
    acceptedTerms: formData.get('acceptedTerms') === 'true',
    acceptedAgeAttestation: formData.get('acceptedAgeAttestation') === 'true',
    acceptedTermsVersionHash: String(
      formData.get('acceptedTermsVersionHash') ?? '',
    ),
    voucherCode: String(formData.get('voucherCode') ?? ''),
  };
  const useCase = new CreateBookingUseCase({
    activityRepo: {} as any, // Injection du repository Drizzle d'activités
    sessionRepo: {} as any, // Injection du repository Drizzle de sessions
    notificationPort: {} as any,
  });
  const result = await useCase.execute(rawInput);
  if (!result.ok)
    return {
      success: false,
      message: `Erreur de réservation : ${result.error.cause} (${result.error.code})`,
    };
  return {
    success: true,
    message: 'Place réservée avec succès !',
    bookingId: result.value.bookingId,
  };
}
