import { CONTACT_FIELDS } from './contact-fields';
import { AUDIENCE_POLICIES, BOOKING_UI, FORM_LABELS, INPUT_LIMITS } from '../../config/constants';
import { ContactField } from './ContactField';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { SESSION_EDIT } from '../../config/session-edit';
export function BookingFields({
  policy,
}: {
  readonly policy: Pick<BookingPageData, 'requirePhone' | 'audiencePolicy'>;
}) {
  const isMinor = policy.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY;
  const requirePhone = policy.requirePhone || isMinor;
  return (
    <fieldset className="ice-fields">
      <legend className="ice-sr-only">{BOOKING_UI.STEP_CONTACT}</legend>
      {isMinor ? <p className="ice-hint">{SESSION_EDIT.CHILD_HINT}</p> : null}
      {CONTACT_FIELDS.map((field) => (
        <ContactField
          key={field.name}
          {...field}
          label={isMinor ? minorLabel(field.name) : field.label}
        />
      ))}
      <ContactField
        label={isMinor ? BOOKING_UI.PHONE_REQUIRED : FORM_LABELS.PHONE}
        name="phone"
        type="tel"
        autoComplete="tel"
        required={requirePhone}
        hint={isMinor ? BOOKING_UI.PHONE_HINT : requirePhone ? undefined : BOOKING_UI.OPTIONAL}
        maxLength={INPUT_LIMITS.KEY_MAX}
      />
      <label className="ice-check ice-marketing">
        <input name="marketingOptIn" type="checkbox" />
        <span>{FORM_LABELS.MARKETING}</span>
      </label>
    </fieldset>
  );
}
function minorLabel(name: string) {
  return name === 'firstName'
    ? SESSION_EDIT.CHILD_FIRST
    : name === 'lastName'
      ? SESSION_EDIT.CHILD_LAST
      : SESSION_EDIT.PARENT_EMAIL;
}
