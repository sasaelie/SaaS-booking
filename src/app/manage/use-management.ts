'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { FORM_LABELS, UI_MESSAGES } from '../../config/constants';
import { useBookingContext } from './use-booking-context';
export function useManagement() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const details = useBookingContext(token);
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
      const result = await sendOperation(form, token, upload);
      setMessage(result.message);
      if (result.ok && upload) details.refresh();
      if (result.ok && !upload) setCancelled(true);
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
    ...details,
    cancelled,
    cancel: (event: FormEvent<HTMLFormElement>) => submit(event, false),
    upload: (event: FormEvent<HTMLFormElement>) => submit(event, true),
  };
}
async function sendOperation(form: FormData, token: string, upload: boolean) {
  const response = await fetch(upload ? '/api/bank-proof' : '/api/self-service', {
    method: 'POST',
    headers: upload ? undefined : { 'Content-Type': 'application/json' },
    body: upload ? form : JSON.stringify({ token }),
  });
  const body: unknown = await response.json();
  return {
    ok: response.ok,
    message: response.ok
      ? upload
        ? FORM_LABELS.PROOF_RECEIVED
        : UI_MESSAGES.CANCEL_SUCCESS
      : operationError(body),
  };
}
function operationError(body: unknown): string {
  const code = body && typeof body === 'object' && 'code' in body ? body.code : '';
  if (code === 'INVALID_PROOF_FILE') return FORM_LABELS.PROOF_INVALID;
  if (code === 'UNAUTHORIZED') return FORM_LABELS.LINK_INVALID;
  if (code === 'CONFIGURATION_ERROR') return FORM_LABELS.STORAGE_UNAVAILABLE;
  return UI_MESSAGES.FAILURE;
}
