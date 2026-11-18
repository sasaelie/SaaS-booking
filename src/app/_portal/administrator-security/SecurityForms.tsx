'use client';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { SAAS } from '../../../config/constants';
import { PortalField } from '../PortalField';
import type { DeviceSecurity } from './use-device-security';
export function RegisterDevice({
  action,
  additional = false,
}: {
  readonly action: DeviceSecurity;
  readonly additional?: boolean;
}) {
  return (
    <form
      className="portal-form"
      aria-label={additional ? C.ADD : C.SETUP}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        action.execute({
          action: 'register-options',
          password: data.get('password'),
          label: data.get('label'),
        });
        e.currentTarget.reset();
      }}
    >
      <fieldset className="portal-form-fields" disabled={action.pending}>
        <PortalField
          name="label"
          label={C.LABEL}
          defaultValue={C.LABEL_DEFAULT}
          maxLength={C.LABEL_MAX}
          required
        />
        <PasswordField />
        <button className="liquid-ice-button portal-button" type="submit">
          {additional ? C.ADD : C.SETUP}
        </button>
      </fieldset>
    </form>
  );
}
export function PasswordField() {
  return (
    <PortalField
      name="password"
      label={C.PASSWORD}
      type="password"
      autoComplete="current-password"
      maxLength={SAAS.AUTH_MAX_PASSWORD}
      required
    />
  );
}
export function RecoveryForm({
  action,
  activate = false,
}: {
  readonly action: DeviceSecurity;
  readonly activate?: boolean;
}) {
  return (
    <form
      className="portal-form"
      aria-label={activate ? C.ACTIVATE : C.RECOVER}
      onSubmit={(e) => {
        e.preventDefault();
        action.execute({
          action: activate ? 'activate' : 'recover',
          code: new FormData(e.currentTarget).get('code'),
        });
        e.currentTarget.reset();
      }}
    >
      <fieldset className="portal-form-fields" disabled={action.pending}>
        <PortalField
          name="code"
          label={activate ? C.CODE_CONFIRM : C.CODE}
          autoComplete="off"
          maxLength={C.CODE_INPUT_MAX}
          required
        />
        <button className="liquid-ice-button portal-button" type="submit">
          {activate ? C.ACTIVATE : C.RECOVER}
        </button>
      </fieldset>
    </form>
  );
}
export function DeviceCeremony({ action }: { readonly action: DeviceSecurity }) {
  return (
    <div className="administrator-device-prompt" role="group" aria-label={C.CONFIRM_DEVICE}>
      <p>{C.DEVICE_PROMPT}</p>
      <div className="portal-actions">
        <button
          type="button"
          className="liquid-ice-button portal-button"
          disabled={action.pending}
          onClick={action.confirmDevice}
        >
          {action.pending ? C.WORKING : C.CONFIRM_DEVICE}
        </button>
        <button
          type="button"
          className="portal-secondary-action"
          disabled={action.pending}
          onClick={action.cancelCeremony}
        >
          {C.CANCEL}
        </button>
      </div>
    </div>
  );
}
