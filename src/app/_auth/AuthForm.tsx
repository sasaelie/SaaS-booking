'use client';
import Link from 'next/link';
import { AUTH_UI } from '../../config/constants';
import { AuthFields } from './AuthFields';
import { useAuthForm } from './use-auth-form';
import type { AuthMode } from './auth-request';
const descriptions = {
  SIGN_IN: AUTH_UI.SIGN_IN_HINT,
  SIGN_UP: AUTH_UI.SIGN_UP_HINT,
  FORGOT: AUTH_UI.FORGOT,
  RESET: AUTH_UI.RESET,
} as const;
const buttons = {
  SIGN_IN: AUTH_UI.LOGIN,
  SIGN_UP: AUTH_UI.REGISTER,
  FORGOT: AUTH_UI.SEND_RESET,
  RESET: AUTH_UI.SAVE_PASSWORD,
} as const;
export function AuthForm({ mode }: { readonly mode: AuthMode }) {
  const form = useAuthForm(mode);
  return (
    <main className="portal-auth">
      <Link href="/" className="portal-brand">
        <span className="ice-brand-mark" aria-hidden="true" />
        {AUTH_UI.BACK_HOME}
      </Link>
      <section className="ice-cube-shell portal-auth-card">
        <h1>{AUTH_UI[mode]}</h1>
        <p>{descriptions[mode]}</p>
        <form onSubmit={form.submit} className="portal-form" aria-busy={form.pending}>
          <AuthFields mode={mode} />
          <button className="liquid-ice-button portal-button" disabled={form.pending}>
            {form.pending ? AUTH_UI.PENDING : buttons[mode]}
          </button>
          {form.message ? (
            <p className="portal-notice" role={form.success ? 'status' : 'alert'}>
              {form.message}
            </p>
          ) : null}
        </form>
        <nav className="portal-auth-links">
          {mode === 'SIGN_IN' ? (
            <>
              <Link href="/inscription">{AUTH_UI.SIGN_UP_LINK}</Link>
              <Link href="/mot-de-passe-oublie">{AUTH_UI.FORGOT_LINK}</Link>
            </>
          ) : (
            <Link href="/connexion">{AUTH_UI.SIGN_IN_LINK}</Link>
          )}
        </nav>
        <p className="portal-auth-note">{AUTH_UI.PRIVACY}</p>
      </section>
    </main>
  );
}
