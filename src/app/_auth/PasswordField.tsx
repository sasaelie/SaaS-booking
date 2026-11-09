'use client';
import { useId, useState } from 'react';
import { AUTH_UI, SAAS } from '../../config/constants';
import { IceIcon } from '../_ui/IceIcon';
interface Props {
  readonly label: string;
  readonly name: string;
  readonly current?: boolean;
  readonly hint?: string;
}
export function PasswordField({ label, name, current = false, hint }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="portal-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={name}
          className="portal-input"
          type={visible ? 'text' : 'password'}
          autoComplete={current ? 'current-password' : 'new-password'}
          required
          minLength={SAAS.AUTH_MIN_PASSWORD}
          maxLength={SAAS.AUTH_MAX_PASSWORD}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-controls={id}
          aria-label={`${visible ? AUTH_UI.HIDE_PASSWORD : AUTH_UI.SHOW_PASSWORD} : ${label}`}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          <IceIcon name={visible ? 'eyeOff' : 'eye'} />
        </button>
      </div>
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
    </div>
  );
}
