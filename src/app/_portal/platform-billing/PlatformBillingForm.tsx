'use client';
import type { ReactNode } from 'react';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { useBillingForm } from './use-billing-form';
import { revealInvalidField } from '../reveal-invalid-field';
export function PlatformBillingForm({
  action,
  children,
  label,
}: {
  readonly action: 'settings' | 'issue';
  readonly children: ReactNode;
  readonly label: string;
}) {
  const { pending, message, success, submit } = useBillingForm(action);
  return (
    <form
      className="portal-form administration-billing-form"
      onSubmit={submit}
      onInvalidCapture={revealInvalidField}
      aria-busy={pending}
    >
      <fieldset className="portal-form-fields" disabled={pending}>
        {children}
        <button className="liquid-ice-button portal-button portal-action-button" data-tone="green">
          {pending ? UI.SAVING : label}
        </button>
      </fieldset>
      {message ? (
        <p className="portal-notice" role={success ? 'status' : 'alert'}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
