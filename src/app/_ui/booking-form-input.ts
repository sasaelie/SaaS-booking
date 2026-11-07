import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
export function bookingFormInput(form: HTMLFormElement, data: BookingPageData, key: string) {
  const fields = new FormData(form);
  return {
    organizationId: data.organizationId,
    activityId: data.activityId,
    idempotencyKey: key,
    startsAtIso: String(fields.get('startsAtIso') ?? ''),
    firstName: String(fields.get('firstName') ?? ''),
    lastName: String(fields.get('lastName') ?? ''),
    email: String(fields.get('email') ?? ''),
    phone: String(fields.get('phone') ?? ''),
    voucherCode: String(fields.get('voucherCode') ?? ''),
    marketingOptIn: fields.has('marketingOptIn'),
    acceptedTerms: fields.has('acceptedTerms'),
    acceptedAgeAttestation: fields.has('acceptedAgeAttestation'),
    acceptedTermsVersionHash: data.terms.versionHash,
  };
}
