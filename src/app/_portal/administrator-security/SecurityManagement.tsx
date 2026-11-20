'use client';
import type { FormEvent } from 'react';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ADMIN_CODES } from '../../../config/administrator-codes';
import { PasswordField } from './SecurityForms';
import type { DeviceSecurity } from './use-device-security';
type Props = { readonly state: AdministratorSecurityState; readonly action: DeviceSecurity };
export function SecurityManagement({ state, action }: Props) {
  return (
    <details className="portal-details">
      <summary>{C.MANAGE}</summary>
      <p className="portal-muted">{C.MANAGE_NOTE}</p>
      <DeviceList state={state} action={action} />
      <CodeRemoval state={state} action={action} />
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
type CommandProps = {
  readonly action: DeviceSecurity;
  readonly command: 'remove' | 'rotate-recovery' | 'disable' | 'code-remove';
  readonly method?: 'totp' | 'email';
  readonly credentialId?: string;
  readonly label: string;
  readonly disabled?: boolean;
};
function PasswordCommand({
  action,
  command,
  credentialId,
  label,
  disabled = false,
  method,
}: CommandProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    action.execute(
      command === 'remove'
        ? { action: command, credentialId, password }
        : command === 'code-remove'
          ? { action: command, method, password }
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

function CodeRemoval({ state, action }: Props) {
  return (
    <>
      {state.totpEnabled ? (
        <details className="portal-details">
          <summary>{ADMIN_CODES.TOTP_REMOVE}</summary>
          <PasswordCommand
            action={action}
            command="code-remove"
            method="totp"
            label={ADMIN_CODES.TOTP_REMOVE}
            disabled={state.enabled && !state.credentials.length && !state.emailEnabled}
          />
        </details>
      ) : null}
      {state.emailEnabled ? (
        <details className="portal-details">
          <summary>{ADMIN_CODES.EMAIL_REMOVE}</summary>
          <PasswordCommand
            action={action}
            command="code-remove"
            method="email"
            label={ADMIN_CODES.EMAIL_REMOVE}
            disabled={state.enabled && !state.credentials.length && !state.totpEnabled}
          />
        </details>
      ) : null}
    </>
  );
}

function DeviceList({ state, action }: Props) {
  return (
    <>
      <ul className="administrator-device-list" aria-label={C.KEY_LIST}>
        {state.credentials.map((key) => (
          <li key={key.id}>
            <span>{key.label}</span>
            <PasswordCommand
              action={action}
              command="remove"
              credentialId={key.id}
              label={C.REMOVE}
              disabled={
                state.enabled &&
                state.credentials.length <= 1 &&
                !state.totpEnabled &&
                !state.emailEnabled
              }
            />
          </li>
        ))}
      </ul>
      {state.enabled &&
      state.credentials.length <= 1 &&
      !state.totpEnabled &&
      !state.emailEnabled ? (
        <p className="portal-muted">{C.LAST_KEY}</p>
      ) : null}
    </>
  );
}
