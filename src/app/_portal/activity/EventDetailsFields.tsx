import { useSearchParams } from 'next/navigation';
import { TERMS_DEFAULTS } from '../../../config/participation-terms';
import { useId } from 'react';
import { SERVICE } from '../../../config/service';
import type { EventDetails } from '../../../core/ports/event-details';
import { PortalField } from '../PortalField';
export function EventDetailsFields({ initial = {} }: { readonly initial?: EventDetails }) {
  const id = useId();
  return (
    <details className="portal-details" open={useSearchParams().get('edit') === 'terms' || undefined}>
      <summary>{SERVICE.DETAILS}</summary>
      <fieldset className="portal-fieldset" aria-label={SERVICE.DETAILS}>
        <PortalField
          label={SERVICE.ADDRESS}
          name="address"
          maxLength={SERVICE.TEXT_MAX}
          defaultValue={initial.address ?? ''}
        />
        <label className="portal-check">
          <input
            type="radio"
            name="addressVisibility"
            value="PUBLIC"
            defaultChecked={initial.addressVisibility !== 'REMINDER'}
          />
          {SERVICE.PUBLIC}
        </label>
        <label className="portal-check">
          <input
            type="radio"
            name="addressVisibility"
            value="REMINDER"
            defaultChecked={initial.addressVisibility === 'REMINDER'}
          />
          {SERVICE.DELAYED}
        </label>
        <DetailsText initial={initial} id={id} />
      </fieldset>
    </details>
  );
}

function DetailsText({ initial, id }: { readonly initial: EventDetails; readonly id: string }) {
  return (
    <>
      {(['practicalInfo', 'participationTerms'] as const).map((name) => (
        <div className="portal-field" key={name}>
          <label htmlFor={`${id}-${name}`}>{name === 'practicalInfo' ? SERVICE.PRACTICAL : SERVICE.TERMS}</label>
          <textarea
            id={`${id}-${name}`}
            className="portal-input"
            name={name}
            maxLength={SERVICE.TEXT_MAX}
            defaultValue={initial[name]?.trim() || (name === 'participationTerms' ? TERMS_DEFAULTS.INSTRUCTIONS : '')}
          />
        </div>
      ))}
      <small>{TERMS_DEFAULTS.EDIT_HINT}</small>
    </>
  );
}
