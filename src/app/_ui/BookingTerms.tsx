import { FORM_LABELS } from '../../config/constants';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
export function BookingTerms({ terms }: { readonly terms: BookingPageData['terms'] }) {
  return (
    <section className="ice-terms" aria-label={FORM_LABELS.TERMS_TITLE}>
      <details>
        <summary>{FORM_LABELS.TERMS_TITLE}</summary>
        <div className="ice-terms-text">{terms.fullText}</div>
      </details>
      <label className="ice-check">
        <input name="acceptedAgeAttestation" type="checkbox" required />
        {terms.ageAttestationLabel}
      </label>
      <label className="ice-check">
        <input name="acceptedTerms" type="checkbox" required />
        {FORM_LABELS.TERMS}
      </label>
    </section>
  );
}
