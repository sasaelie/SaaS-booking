'use client';
import { useEffect, useState } from 'react';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import { TIME } from '../../../config/constants';
import { PasswordField } from './SecurityForms';
import { PortalField } from '../PortalField';
import type { DeviceSecurity } from './use-device-security';
export function PrepareCodeMethod({
  action,
  method,
  label,
}: {
  readonly action: DeviceSecurity;
  readonly method: 'totp' | 'email';
  readonly label: string;
}) {
  return (
    <form
      className="portal-form"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        action.execute({
          action: method === 'totp' ? 'totp-prepare' : 'email-prepare',
          password: new FormData(event.currentTarget).get('password'),
        });
        event.currentTarget.reset();
      }}
    >
      <fieldset className="portal-form-fields" disabled={action.pending}>
        <PasswordField />
        <button className="liquid-ice-button portal-button" type="submit">
          {label}
        </button>
      </fieldset>
    </form>
  );
}
export function OtpForm({
  action,
  operation,
  label,
}: {
  readonly action: DeviceSecurity;
  readonly operation: 'totp-confirm' | 'totp-verify' | 'email-confirm' | 'email-verify';
  readonly label: string;
}) {
  return (
    <form
      className="portal-form"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        action.execute({ action: operation, code: new FormData(event.currentTarget).get('code') });
        event.currentTarget.reset();
      }}
    >
      <fieldset className="portal-form-fields" disabled={action.pending}>
        <PortalField
          name="code"
          label={C.CODE}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={C.DIGITS}
          minLength={C.DIGITS}
          pattern="[0-9]{6}"
          required
        />
        <button className="liquid-ice-button portal-button" type="submit">
          {label}
        </button>
      </fieldset>
    </form>
  );
}
export function useEmailCooldown(until: string | null | undefined) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TIME.SECOND_MS);
    return () => clearInterval(id);
  }, []);
  return until ? Math.max(0, Math.ceil((Date.parse(until) - now) / TIME.SECOND_MS)) : 0;
}
