'use client';
import type { ReactNode } from 'react';
import { PORTAL } from '../../config/constants';
import { usePortalForm } from './use-portal-form';
import type { PortalAction } from './form-command';
import { revealInvalidField } from './reveal-invalid-field';
interface Props {
  readonly tone?: 'green' | 'orange' | 'red';
  readonly action: PortalAction;
  readonly organizationId?: string;
  readonly children?: ReactNode;
  readonly submitLabel?: string;
  readonly disabled?: boolean;
  readonly submitDisabled?: boolean;
  readonly compact?: boolean;
}
export function PortalForm({
  action,
  organizationId,
  children,
  submitLabel = PORTAL.SAVE,
  disabled = false,
  submitDisabled = false,
  compact = false,
  tone,
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
        <button
          className="liquid-ice-button portal-button portal-action-button"
          data-tone={tone}
          disabled={state.pending || disabled || submitDisabled}
        >
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
