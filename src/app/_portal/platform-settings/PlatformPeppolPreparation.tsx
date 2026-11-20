'use client';
import type { FormEvent } from 'react';
import type { PlatformSettingsState } from '../../../core/ports/platform-settings';
import { PlatformConnectionSchema } from '../../../core/validation/platform-settings';
import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
import { PortalField } from '../PortalField';
import { PortalSelect } from '../PortalSelect';
import { StatusBadge } from '../StatusBadge';
import { useSettingsMutation } from './use-settings-mutation';
import { SettingsFeedback } from './SettingsFeedback';
import { revealInvalidField } from '../reveal-invalid-field';
export function PlatformPeppolPreparation({ state }: { readonly state: PlatformSettingsState }) {
  const action = useSettingsMutation();
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = PlatformConnectionSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (input.success)
      action.execute({ action: 'connection', revision: state.revision, connection: input.data });
  }
  return (
    <section className="portal-panel platform-peppol-preparation">
      <h2>{UI.CONNECTIONS}</h2>
      <StatusBadge status={{ tone: 'orange', label: UI.DISCONNECTED }} />
      <p className="portal-muted">{UI.CONNECTION_NOTE}</p>
      <form
        className="portal-form"
        onSubmit={save}
        onInvalidCapture={revealInvalidField}
        aria-busy={action.pending}
      >
        <fieldset className="portal-form-fields" disabled={action.pending}>
          <ConnectionFields state={state} />
          <button className="liquid-ice-button portal-button" type="submit">
            {action.pending ? UI.WORKING : UI.CONNECTION_SAVE}
          </button>
        </fieldset>
      </form>
      <SettingsFeedback action={action} />
      <ConnectionNextSteps />
    </section>
  );
}
function ConnectionFields({ state }: { readonly state: PlatformSettingsState }) {
  return (
    <>
      <PortalSelect name="provider" label={UI.PROVIDER} defaultValue={state.connection.provider}>
        {UI.PROVIDERS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </PortalSelect>
      <PortalField
        name="participantId"
        label={UI.PARTICIPANT}
        defaultValue={state.connection.participantId}
        maxLength={UI.PARTICIPANT_MAX}
        pattern="([0-9]{4}:[A-Za-z0-9._-]+)?"
        hint={UI.PARTICIPANT_HINT}
      />
    </>
  );
}

function ConnectionNextSteps() {
  return (
    <>
      <p className="portal-muted">{UI.CONNECTION_NEXT}</p>
      <a
        className="portal-inline-link"
        href={UI.DIRECTORY_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {UI.DIRECTORY}
      </a>
    </>
  );
}
