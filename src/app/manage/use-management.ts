'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { FORM_LABELS, UI_MESSAGES } from '../../config/constants';
export function useManagement() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>, upload: boolean): Promise<void> {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    form.set('token', token);
    setPending(true);
    try {
      const response = await fetch(upload ? '/api/bank-proof' : '/api/self-service', {
        method: 'POST',
        headers: upload ? undefined : { 'Content-Type': 'application/json' },
        body: upload ? form : JSON.stringify({ token }),
      });
      setMessage(
        response.ok
          ? upload
            ? FORM_LABELS.DONE
            : UI_MESSAGES.CANCEL_SUCCESS
          : UI_MESSAGES.FAILURE,
      );
    } catch {
      setMessage(UI_MESSAGES.FAILURE);
    } finally {
      setPending(false);
    }
  }
  return {
    token,
    message,
    pending,
    cancel: (event: FormEvent<HTMLFormElement>) => submit(event, false),
    upload: (event: FormEvent<HTMLFormElement>) => submit(event, true),
  };
}
