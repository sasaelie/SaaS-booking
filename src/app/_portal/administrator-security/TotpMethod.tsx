'use client';
import { useState } from 'react';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import type { DeviceSecurity } from './use-device-security';
import { PrepareCodeMethod, OtpForm } from './CodeForms';
type Props = { readonly state: AdministratorSecurityState; readonly action: DeviceSecurity };
export function TotpMethod({ state, action }: Props) {
  const canConfigure = !state.enabled || state.verified;
  return (
    <section className="administrator-method-content">
      <h2>{C.TOTP}</h2>
      {action.totpSecret ? (
        <ManualTotpSetup
          secret={action.totpSecret}
          account={state.emailAddress ?? ''}
          action={action}
        />
      ) : (
        <>
          {state.totpEnabled ? (
            <>
              <p className="portal-muted">{C.TOTP_ACTIVE}</p>
              <p className="portal-muted">{C.TOTP_VERIFY_NOTE}</p>
              <OtpForm action={action} operation="totp-verify" label={C.TOTP_VERIFY} />
            </>
          ) : null}
          {canConfigure ? (
            <details className="portal-details" open={!state.totpEnabled}>
              <summary>{state.totpEnabled ? C.TOTP_REPLACE : C.TOTP_SETUP}</summary>
              <p className="portal-muted">{C.TOTP_NOTE}</p>
              <PrepareCodeMethod method="totp" action={action} label={C.TOTP_SETUP} />
            </details>
          ) : !state.totpEnabled ? (
            <p>{C.METHOD_NOT_READY}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
type ManualProps = {
  readonly secret: string;
  readonly account: string;
  readonly action: DeviceSecurity;
};
function ManualTotpSetup({ secret, account, action }: ManualProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <p className="portal-muted">{C.TOTP_SECRET_NOTE}</p>
      <dl className="administrator-manual-key">
        <div>
          <dt>{C.TOTP_ACCOUNT}</dt>
          <dd>{account}</dd>
        </div>
        <div>
          <dt>{C.TOTP_SECRET}</dt>
          <dd>
            <code>{secret}</code>
          </dd>
        </div>
      </dl>
      <p className="portal-muted">{C.TOTP_KIND}</p>
      <button className="portal-secondary-action" type="button" onClick={() => void copy()}>
        {C.COPY_SECRET}
      </button>
      {copied ? <p role="status">{C.COPIED}</p> : null}
      <OtpForm action={action} operation="totp-confirm" label={C.TOTP_CONFIRM} />
    </>
  );
}
