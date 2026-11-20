'use client';
import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { billingFormCommand } from './billing-form-command';
export function useBillingForm(action: 'settings' | 'issue') {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = billingFormCommand(action, new FormData(event.currentTarget));
    start(async () => {
      try {
        const response = await fetch('/api/plateforme/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, input }),
        });
        setSuccess(response.ok);
        setMessage(response.ok ? UI.SAVED : UI.ERROR);
        if (response.ok) router.refresh();
      } catch {
        setSuccess(false);
        setMessage(UI.ERROR);
      }
    });
  }
  return { pending, message, success, submit };
}
