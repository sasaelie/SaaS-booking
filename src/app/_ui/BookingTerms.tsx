import { FORM_LABELS } from '../../config/constants';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
export function BookingTerms({ terms }: { readonly terms: BookingPageData['terms'] }) {
  return (
    <section className="ice-terms" aria-label={FORM_LABELS.TERMS_TITLE}>
      <a
        href="#participant-terms"
        onClick={() => {
          const details = document.getElementById('participant-terms');
          if (details instanceof HTMLDetailsElement) details.open = true;
        }}
      >
        {FORM_LABELS.TERMS_TITLE}
      </a>
      <label className="ice-check">
        <input name="acceptedAgeAttestation" type="checkbox" required />
        <span>{terms.ageAttestationLabel}</span>
      </label>
      <label className="ice-check">
        <input name="acceptedTerms" type="checkbox" required />
        <span>{FORM_LABELS.TERMS}</span>
      </label>
    </section>
  );
}
