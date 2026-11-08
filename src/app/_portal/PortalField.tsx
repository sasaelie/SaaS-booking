'use client';
import { useId, type InputHTMLAttributes, type Ref } from 'react';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly ref?: Ref<HTMLInputElement>;
}
export function PortalField({ label, hint, error, ...input }: Props) {
  const id = useId();
  return (
    <div className="portal-field">
      <label htmlFor={id}>{label}</label>
      <input
        className="portal-input"
        id={id}
        aria-describedby={
          [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
          undefined
        }
        aria-invalid={error ? true : undefined}
        {...input}
      />
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
      {error ? (
        <small id={`${id}-error`} role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
