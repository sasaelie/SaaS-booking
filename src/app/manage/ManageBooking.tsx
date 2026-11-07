'use client';
import { FORM_LABELS, PAYMENT_RULES } from '../../config/constants';
import { useManagement } from './use-management';
export function ManageBooking() {
  const state = useManagement();
  return (
    <div className="ice-widget-root ice-cube-shell ice-form">
      <h1>{FORM_LABELS.MANAGE}</h1>
      <form onSubmit={state.cancel}>
        <label className="ice-check">
          <input type="checkbox" required />
          {FORM_LABELS.CONFIRM_CANCEL}
        </label>
        <button className="liquid-ice-button" disabled={!state.token || state.pending}>
          {FORM_LABELS.CANCEL}
        </button>
      </form>
      <form onSubmit={state.upload}>
        <label>
          {FORM_LABELS.PROOF}
          <input
            type="file"
            name="proof"
            accept={PAYMENT_RULES.ALLOWED_PROOF_MIME_TYPES.join(',')}
            required
          />
        </label>
        <button className="liquid-ice-button" disabled={!state.token || state.pending}>
          {FORM_LABELS.UPLOAD}
        </button>
      </form>
      <p role="status">{state.message}</p>
    </div>
  );
}
