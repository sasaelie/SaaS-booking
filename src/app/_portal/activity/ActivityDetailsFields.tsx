import { useId } from 'react';
import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI, INPUT_LIMITS, SAAS } from '../../../config/constants';
import { PortalField } from '../PortalField';
export function ActivityDetailsFields({ initial }: { readonly initial?: PortalActivity }) {
  const id = useId();
  return (
    <>
      <PortalField
        label={ACTIVITY_UI.NAME}
        name="name"
        required
        minLength={INPUT_LIMITS.NAME_MIN}
        maxLength={INPUT_LIMITS.NAME_MAX}
        defaultValue={initial?.name}
      />
      <div className="portal-field">
        <label htmlFor={id}>{ACTIVITY_UI.DESCRIPTION}</label>
        <textarea
          id={id}
          className="portal-input"
          name="description"
          maxLength={SAAS.MAX_DESCRIPTION}
          defaultValue={initial?.description ?? ''}
        />
      </div>
    </>
  );
}
