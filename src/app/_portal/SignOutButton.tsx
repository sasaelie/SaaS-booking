'use client';
import { useState } from 'react';
import { PORTAL } from '../../config/constants';
export function SignOutButton({
  className = 'portal-text-button',
}: {
  readonly className?: string;
}) {
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
        window.location.replace('/connexion');
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
      <button type="button" className={className} onClick={signOut} disabled={pending}>
        {PORTAL.SIGN_OUT}
      </button>
      {error ? <p role="alert">{PORTAL.ERROR}</p> : null}
    </div>
  );
}
