'use client';
import { useState, type FormEvent } from 'react';
import type { PlatformSettingsState } from '../../../core/ports/platform-settings';
import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
import { ProfileFields } from './ProfileFields';
import { profileFromForm } from './profile-command';
import { useSettingsMutation } from './use-settings-mutation';
import { revealInvalidField } from '../reveal-invalid-field';
import { SettingsFeedback, type SettingsMutation } from './SettingsFeedback';
import { ProfilePublication } from './ProfilePublication';
export function PlatformProfileEditor({ state }: { readonly state: PlatformSettingsState }) {
  const action = useSettingsMutation();
  const [dirty, setDirty] = useState(false);
  const [invalid, setInvalid] = useState(false);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = profileFromForm(new FormData(event.currentTarget));
    setInvalid(!parsed.success);
    if (parsed.success)
      action.execute({ action: 'save', revision: state.revision, profile: parsed.data }, () =>
        setDirty(false),
      );
  }
  return (
    <div className="platform-settings-workspace">
      <section className="portal-panel">
        <h2>{UI.PROFILE}</h2>
        <p className="portal-muted">{UI.OPTIONAL}</p>
        <p className="portal-muted">{UI.BILLING_NOTE}</p>
        <DraftForm state={state} action={action} save={save} changed={() => setDirty(true)} />
        <SettingsFeedback action={action} invalid={invalid} />
      </section>
      <ProfilePublication state={state} action={action} dirty={dirty} />
    </div>
  );
}
function DraftForm({
  state,
  action,
  save,
  changed,
}: {
  readonly state: PlatformSettingsState;
  readonly action: SettingsMutation;
  readonly save: (event: FormEvent<HTMLFormElement>) => void;
  readonly changed: () => void;
}) {
  return (
    <form
      className="portal-form"
      onSubmit={save}
      onChange={changed}
      onInvalidCapture={revealInvalidField}
      aria-busy={action.pending}
    >
      <fieldset className="portal-form-fields" disabled={action.pending}>
        <ProfileFields profile={state.draft} />
        <button className="liquid-ice-button portal-button" type="submit">
          {action.pending ? UI.WORKING : UI.SAVE}
        </button>
      </fieldset>
    </form>
  );
}
