import { FORM_LABELS } from '../../config/constants';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { ParticipationTerms } from './ParticipationTerms';
export function BookingTerms({
  terms,
  editUrl,
  active,
}: {
  readonly terms: BookingPageData['terms'];
  readonly editUrl?: string;
  readonly active: boolean;
}) {
  return (
    <section className="ice-terms" aria-label={FORM_LABELS.TERMS_TITLE}>
      {active ? <ParticipationTerms text={terms.fullText} editUrl={editUrl} /> : null}
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
