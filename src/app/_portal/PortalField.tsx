'use client';
import { useId, type InputHTMLAttributes } from 'react';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly hint?: string;
}
export function PortalField({ label, hint, ...input }: Props) {
  const id = useId();
  return (
    <div className="portal-field">
      <label htmlFor={id}>{label}</label>
      <input
        className="portal-input"
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
    </div>
  );
}
