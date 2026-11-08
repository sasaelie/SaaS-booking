import { AUTH_UI, SAAS, INPUT_LIMITS } from '../../config/constants';
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
    </>
  );
}

function AuthPasswordFields({ mode }: { readonly mode: AuthMode }) {
  return (
    <>
      {mode !== 'FORGOT' ? (
        <PortalField
          label={AUTH_UI.PASSWORD}
          name="password"
          type="password"
          autoComplete={mode === 'SIGN_IN' ? 'current-password' : 'new-password'}
          required
          minLength={SAAS.AUTH_MIN_PASSWORD}
          maxLength={SAAS.AUTH_MAX_PASSWORD}
          hint={mode !== 'SIGN_IN' ? AUTH_UI.PASSWORD_HINT : undefined}
        />
      ) : null}
      {mode === 'SIGN_UP' || mode === 'RESET' ? (
        <PortalField
          label={AUTH_UI.CONFIRM_PASSWORD}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={SAAS.AUTH_MIN_PASSWORD}
          maxLength={SAAS.AUTH_MAX_PASSWORD}
        />
      ) : null}
    </>
  );
}
