import Link from 'next/link';
import { AUTH_UI, INPUT_LIMITS } from '../../config/constants';
import { PasswordField } from './PasswordField';
import { PortalField } from '../_portal/PortalField';
import type { AuthMode } from './auth-request';
export function AuthFields({ mode }: { readonly mode: AuthMode }) {
  return (
    <>
      {mode === 'SIGN_UP' ? (
        <PortalField
          label={AUTH_UI.NAME}
          name="name"
          autoComplete="name"
          required
          minLength={INPUT_LIMITS.NAME_MIN}
          maxLength={INPUT_LIMITS.NAME_MAX}
        />
      ) : null}
      {mode !== 'RESET' ? (
        <PortalField
          label={AUTH_UI.EMAIL}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={INPUT_LIMITS.EMAIL_MAX}
        />
      ) : null}
      <AuthPasswordFields mode={mode} />
      {mode === 'SIGN_IN' ? (
        <Link className="auth-forgot-link" href="/mot-de-passe-oublie">
          {AUTH_UI.FORGOT_LINK}
        </Link>
      ) : null}
    </>
  );
}

function AuthPasswordFields({ mode }: { readonly mode: AuthMode }) {
  return (
    <>
      {mode !== 'FORGOT' ? (
        <PasswordField
          label={AUTH_UI.PASSWORD}
          name="password"
          current={mode === 'SIGN_IN'}
          hint={mode !== 'SIGN_IN' ? AUTH_UI.PASSWORD_HINT : undefined}
        />
      ) : null}
      {mode === 'SIGN_UP' || mode === 'RESET' ? (
        <PasswordField label={AUTH_UI.CONFIRM_PASSWORD} name="confirm" />
      ) : null}
    </>
  );
}
