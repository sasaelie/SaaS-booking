import { CONTACT_FIELDS } from './contact-fields';
import { FORM_LABELS, INPUT_LIMITS } from '../../config/constants';
import { ContactField } from './ContactField';
export function BookingFields({ requirePhone }: { readonly requirePhone: boolean }) {
  return (
    <fieldset className="ice-fields">
      <legend>Coordonnées</legend>
      {CONTACT_FIELDS.map((field) => (
        <ContactField key={field.name} {...field} />
      ))}
      <ContactField
        label={FORM_LABELS.PHONE}
        name="phone"
        type="tel"
        autoComplete="tel"
        required={requirePhone}
        maxLength={INPUT_LIMITS.KEY_MAX}
      />
      <label className="ice-check">
        <input name="marketingOptIn" type="checkbox" />
        {FORM_LABELS.MARKETING}
      </label>
    </fieldset>
  );
}
