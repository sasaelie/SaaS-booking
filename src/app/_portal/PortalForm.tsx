'use client';
import type { ReactNode } from 'react';
import { PORTAL } from '../../config/constants';
import { usePortalForm } from './use-portal-form';
import type { PortalAction } from './form-command';
import { revealInvalidField } from './reveal-invalid-field';
interface Props {
  readonly action: PortalAction;
  readonly organizationId?: string;
  readonly children?: ReactNode;
  readonly submitLabel?: string;
  readonly disabled?: boolean;
  readonly compact?: boolean;
}
export function PortalForm({
  action,
  organizationId,
  children,
  submitLabel = PORTAL.SAVE,
  disabled = false,
  compact = false,
}: Props) {
  const state = usePortalForm(action, organizationId);
  return (
    <form
      className={compact ? 'portal-form portal-form-compact' : 'portal-form'}
      onSubmit={state.submit}
      onInvalidCapture={revealInvalidField}
      aria-busy={state.pending}
    >
      <fieldset className="portal-form-fields" disabled={state.pending || disabled}>
        {children}
        <button className="liquid-ice-button portal-button" disabled={state.pending || disabled}>
          {state.pending ? PORTAL.SAVING : submitLabel}
        </button>
      </fieldset>
      {state.message ? (
        <p className="portal-notice" role={state.success ? 'status' : 'alert'}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
