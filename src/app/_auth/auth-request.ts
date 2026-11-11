import { AUTH_UI } from '../../config/constants';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { planPath } from '../../lib/plan-selection';
export type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'FORGOT' | 'RESET';
type AuthRequest =
  | { readonly error: string }
  | { readonly path: string; readonly body: Readonly<Record<string, string>> };
export function authRequest(
  mode: AuthMode,
  form: FormData,
  token: string,
  plan: PlanIntent | null = null,
): AuthRequest {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  if ((mode === 'SIGN_UP' || mode === 'RESET') && password !== confirm)
    return { error: AUTH_UI.PASSWORD_MISMATCH };
  if (mode === 'RESET' && !token) return { error: AUTH_UI.EXPIRED_RESET };
  const callbackURL = `${window.location.origin}${planPath('/app', plan)}`;
  switch (mode) {
    case 'SIGN_IN':
      return { path: 'sign-in/email', body: { email, password, callbackURL } };
    case 'SIGN_UP':
      return {
        path: 'sign-up/email',
        body: { email, password, name: String(form.get('name') ?? '').trim(), callbackURL },
      };
    case 'FORGOT':
      return {
        path: 'request-password-reset',
        body: {
          email,
          redirectTo: `${window.location.origin}${planPath('/nouveau-mot-de-passe', plan)}`,
        },
      };
    case 'RESET':
      return { path: 'reset-password', body: { newPassword: password, token } };
  }
}
