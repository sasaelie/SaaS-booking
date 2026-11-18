'use client';
import type { FormEvent } from 'react';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { PasswordField, RegisterDevice } from './SecurityForms';
import type { DeviceSecurity } from './use-device-security';
export function SecurityManagement({
  state,
  action,
}: {
  readonly state: AdministratorSecurityState;
  readonly action: DeviceSecurity;
}) {
  return (
    <details className="portal-details">
      <summary>{C.MANAGE}</summary>
      <p className="portal-muted">{C.MANAGE_NOTE}</p>
      <ul className="administrator-device-list" aria-label={C.KEY_LIST}>
        {state.credentials.map((key) => (
          <li key={key.id}>
            <span>{key.label}</span>
            <PasswordCommand
              action={action}
              command="remove"
              credentialId={key.id}
              label={C.REMOVE}
              disabled={state.enabled && state.credentials.length <= 1}
            />
          </li>
        ))}
      </ul>
      {state.enabled && state.credentials.length <= 1 ? (
        <p className="portal-muted">{C.LAST_KEY}</p>
      ) : null}
      <RegisterDevice action={action} additional />
      <PasswordCommand action={action} command="rotate-recovery" label={C.ROTATE} />
      {state.enabled ? (
        <details className="portal-details">
          <summary>{C.DISABLE}</summary>
          <p className="portal-muted">{C.DISABLE_NOTE}</p>
          <PasswordCommand action={action} command="disable" label={C.DISABLE} />
        </details>
      ) : null}
    </details>
  );
}
function PasswordCommand({
  action,
  command,
  credentialId,
  label,
  disabled = false,
}: {
  readonly action: DeviceSecurity;
  readonly command: 'remove' | 'rotate-recovery' | 'disable';
  readonly credentialId?: string;
  readonly label: string;
  readonly disabled?: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    action.execute(
      command === 'remove'
        ? { action: command, credentialId, password }
        : { action: command, password },
    );
    event.currentTarget.reset();
  }
  return (
    <form
      className="portal-form administrator-password-command"
      aria-label={label}
      onSubmit={submit}
    >
      <fieldset className="portal-form-fields" disabled={action.pending || disabled}>
        <PasswordField />
        <button className="portal-secondary-action" type="submit">
          {label}
        </button>
      </fieldset>
    </form>
  );
}
