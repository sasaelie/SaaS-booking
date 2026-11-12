'use client';
import { useState, type FormEvent, type ReactNode } from 'react';
import { BILLING_PREVIEW as UI } from '../../config/billing-preview';
import type { BillingInterval } from '../../config/commercial';
import { PaymentReview } from './PaymentReview';
export function PlanCheckoutPreview({
  offered,
  disabled,
  children,
}: {
  readonly offered: boolean;
  readonly disabled: boolean;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>('month');
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setInterval(form.get('interval') === 'year' ? 'year' : 'month');
    setOpen(true);
  }
  return (
    <>
      <p className="portal-notice">{offered ? UI.OFFERED : UI.TEST}</p>
      <form className="portal-form" onSubmit={review}>
        <fieldset className="portal-form-fields" disabled={disabled}>
          {children}
          <button type="submit" className="liquid-ice-button portal-button" disabled={disabled}>
            {UI.ACTION}
          </button>
        </fieldset>
      </form>
      <PaymentReview
        open={open}
        interval={interval}
        offered={offered}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
