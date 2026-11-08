'use client';
import type { ReactNode } from 'react';
import { PORTAL, INPUT_LIMITS } from '../../config/constants';
import { PortalField } from './PortalField';
import { useAdminOperation } from './use-admin-operation';
interface Props {
  readonly children?: ReactNode;
  readonly command: Readonly<Record<string, unknown>>;
  readonly label: string;
  readonly reasonRequired?: boolean;
  readonly voucherOverride?: boolean;
}
export function AdminOperation({
  command,
  children,
  label,
  reasonRequired = false,
  voucherOverride = false,
}: Props) {
  const state = useAdminOperation(command);
  return (
    <form className="portal-form" onSubmit={state.submit} aria-busy={state.pending}>
      <fieldset className="portal-form-fields" disabled={state.pending}>
        {children ? <div onChange={state.invalidate}>{children}</div> : null}
        {reasonRequired ? (
          <PortalField
            label={PORTAL.REASON}
            name="reason"
            required
            maxLength={INPUT_LIMITS.TOKEN_MAX}
          />
        ) : null}
        {voucherOverride ? <VoucherOverride /> : null}
        <AffectedConfirmation state={state} />
        <button className="liquid-ice-button portal-button" disabled={state.pending}>
          {state.pending ? PORTAL.SAVING : state.confirmation ? PORTAL.CONFIRM : label}
        </button>
      </fieldset>
      {state.message ? (
        <p className="portal-notice" role="status">
          {state.message}
        </p>
      ) : null}
      {state.proof ? (
        <a className="portal-button" href={state.proof} target="_blank" rel="noopener noreferrer">
          {PORTAL.PROOF_READY}
        </a>
      ) : null}
    </form>
  );
}

function AffectedConfirmation({ state }: { readonly state: ReturnType<typeof useAdminOperation> }) {
  return (
    <>
      {state.confirmation ? (
        <div className="portal-notice" role="status">
          <strong>
            {PORTAL.AFFECTED} : {state.confirmation.count}
          </strong>
          <p>{PORTAL.CLOSE_CONFIRM}</p>
          <label className="portal-check">
            <input
              type="checkbox"
              required
              checked={state.accepted}
              onChange={(event) => state.setAccepted(event.target.checked)}
            />
            {PORTAL.CONFIRM_MANAGEMENT}
          </label>
        </div>
      ) : null}
    </>
  );
}

function VoucherOverride() {
  return (
    <label className="portal-check">
      <input type="checkbox" name="adminOverride" />
      {PORTAL.ALLOW_VOUCHER}
    </label>
  );
}
