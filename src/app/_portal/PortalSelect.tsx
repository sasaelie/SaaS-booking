'use client';
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly children: ReactNode;
}
export function PortalSelect({ label, children, ...input }: Props) {
  const id = useId();
  return (
    <div className="portal-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="portal-input" {...input}>
        {children}
      </select>
    </div>
  );
}
