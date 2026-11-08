'use client';
import { useState } from 'react';
import { PORTAL } from '../../config/constants';
export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (response.ok) {
        window.location.assign('/connexion');
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button type="button" className="portal-text-button" onClick={signOut} disabled={pending}>
        {PORTAL.SIGN_OUT}
      </button>
      {error ? <p role="alert">{PORTAL.ERROR}</p> : null}
    </div>
  );
}
