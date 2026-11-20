'use client';
import { useEffect, useState } from 'react';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ADMIN_CODES } from '../../../config/administrator-codes';
import { PressableLink } from '../../_ui/PressableLink';
import { StatusBadge } from '../StatusBadge';
import { useDeviceSecurity, type DeviceSecurity } from './use-device-security';
import { RecoveryForm, DeviceCeremony } from './SecurityForms';
import { RecoveryCodes } from './RecoveryCodes';
import { SecurityManagement } from './SecurityManagement';
import { MethodSelector, type SecurityMethod } from './MethodSelector';
import { PasskeyMethod } from './PasskeyMethod';
import { TotpMethod } from './TotpMethod';
import { EmailMethod } from './EmailMethod';
export function AdministratorSecurity({ state }: { readonly state: AdministratorSecurityState }) {
  const action = useDeviceSecurity(),
    selection = useMethodSelection(state);
  const pending =
    !state.enabled && (hasFactors(state) || action.totpSecret || action.emailState.sent);
  return (
    <section className="portal-panel administrator-security-panel" aria-busy={action.pending}>
      <StatusBadge
        status={{
          tone: state.enabled ? 'green' : pending ? 'orange' : 'neutral',
          label: state.enabled ? C.ACTIVE : pending ? C.PENDING : C.INACTIVE,
        }}
      />
      <p className="portal-muted">{ADMIN_CODES.HELP}</p>
      {state.enabled && !state.verified ? <p>{C.REQUIRED}</p> : null}
      {action.message ? (
        <p role="status" className={action.success ? 'portal-success' : 'portal-error'}>
          {action.message}
        </p>
      ) : null}
      <MethodSelector method={selection.method} select={selection.setMethod} state={state} />
      <div
        id="security-method-content"
        role="tabpanel"
        aria-labelledby={`security-tab-${selection.method}`}
      >
        {action.ceremony ? (
          <DeviceCeremony action={action} />
        ) : (
          <SelectedMethod {...selection} state={state} action={action} />
        )}
      </div>
      <SharedSecurity state={state} action={action} />
    </section>
  );
}
function useMethodSelection(state: AdministratorSecurityState) {
  const [supported, setSupported] = useState<boolean | null>(null),
    [method, setMethod] = useState<SecurityMethod>(
      state.totpEnabled ? 'totp' : state.emailEnabled ? 'email' : 'passkey',
    );
  useEffect(() => {
    const available = Boolean(window.PublicKeyCredential && navigator.credentials);
    setSupported(available);
    if (!available) setMethod((previous) => (previous === 'passkey' ? 'totp' : previous));
  }, []);
  return { supported, method, setMethod };
}
function SelectedMethod({
  method,
  supported,
  state,
  action,
}: {
  readonly method: SecurityMethod;
  readonly supported: boolean | null;
  readonly state: AdministratorSecurityState;
  readonly action: DeviceSecurity;
}) {
  if (method === 'totp') return <TotpMethod state={state} action={action} />;
  if (method === 'email') return <EmailMethod state={state} action={action} />;
  return <PasskeyMethod state={state} action={action} supported={supported} />;
}
function hasFactors(state: AdministratorSecurityState) {
  return Boolean(state.credentials.length || state.totpEnabled || state.emailEnabled);
}
function SharedSecurity({
  state,
  action,
}: {
  readonly state: AdministratorSecurityState;
  readonly action: DeviceSecurity;
}) {
  return (
    <>
      {state.verified ? <p className="portal-muted">{C.VERIFIED}</p> : null}
      {action.codes.length ? <RecoveryCodes codes={action.codes} /> : null}
      {!state.enabled && hasFactors(state) && state.verified ? (
        <RecoveryForm action={action} activate />
      ) : null}
      {state.enabled && !state.verified ? (
        <details className="portal-details">
          <summary>{C.RECOVER}</summary>
          <RecoveryForm action={action} />
        </details>
      ) : null}
      {state.enabled && state.verified ? (
        <>
          <p className="portal-muted">
            {C.RECOVERY_COUNT} : {state.recoveryRemaining}
          </p>
          <PressableLink className="liquid-ice-button portal-button" href="/plateforme">
            {C.BACK}
          </PressableLink>
        </>
      ) : null}
      {hasFactors(state) && state.verified ? (
        <SecurityManagement state={state} action={action} />
      ) : null}
    </>
  );
}
