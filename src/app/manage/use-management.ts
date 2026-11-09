'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { UI_MESSAGES } from '../../config/constants';
import { sendOperation } from './management-response';
import { useBookingContext } from './use-booking-context';
export function useManagement() {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const details = useBookingContext(token);
  useEffect(() => {
    const readToken = () => {
      setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
      setMessage('');
    };
    readToken();
    window.addEventListener('hashchange', readToken);
    return () => window.removeEventListener('hashchange', readToken);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>, upload: boolean): Promise<void> {
    event.preventDefault();
    if (!token || pending) return;
    const form = new FormData(event.currentTarget);
    form.set('token', token);
    setPending(true);
    try {
      const result = await sendOperation(form, token, upload);
      setMessage(result.message);
      if (result.ok) details.refresh();
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
    cancelled: message === UI_MESSAGES.CANCEL_SUCCESS,
    cancel: (event: FormEvent<HTMLFormElement>) => submit(event, false),
    upload: (event: FormEvent<HTMLFormElement>) => submit(event, true),
  };
}
