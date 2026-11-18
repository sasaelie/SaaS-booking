'use client';
import { useEffect, useState } from 'react';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { PressableLink } from '../../_ui/PressableLink';
import { StatusBadge } from '../StatusBadge';
import { useDeviceSecurity, type DeviceSecurity } from './use-device-security';
import { RegisterDevice, RecoveryForm, DeviceCeremony } from './SecurityForms';
import { RecoveryCodes } from './RecoveryCodes';
import { SecurityManagement } from './SecurityManagement';
export function AdministratorSecurity({ state }: { readonly state: AdministratorSecurityState }) {
  const action = useDeviceSecurity(),
    [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    setSupported(Boolean(window.PublicKeyCredential && navigator.credentials));
  }, []);
  const pending = !state.enabled && state.credentials.length > 0;
  return (
    <section className="portal-panel administrator-security-panel" aria-busy={action.pending}>
      <StatusBadge
        status={{
          tone: state.enabled ? 'green' : pending ? 'orange' : 'neutral',
          label: state.enabled ? C.ACTIVE : pending ? C.PENDING : C.INACTIVE,
        }}
      />
      <p>{C.DEVICE}</p>
      <p className="portal-muted">{C.ORIGIN_NOTE}</p>
      {supported === false ? <p role="status">{C.UNSUPPORTED}</p> : null}
      {action.message ? (
        <p role="status" className={action.success ? 'portal-success' : 'portal-error'}>
          {action.message}
        </p>
      ) : null}
      {action.ceremony ? (
        <DeviceCeremony action={action} />
      ) : (
        <SecurityFlow state={state} action={action} supported={supported !== false} />
      )}
    </section>
  );
}
function SecurityFlow({
  state,
  action,
  supported,
}: {
  readonly state: AdministratorSecurityState;
  readonly action: DeviceSecurity;
  readonly supported: boolean;
}) {
  return (
    <>
      {state.enabled && !state.verified ? <p>{C.REQUIRED}</p> : null}
      {state.verified ? <p className="portal-muted">{C.VERIFIED}</p> : null}
      {state.credentials.length > 0 && supported ? (
        <button
          className={state.verified ? 'portal-secondary-action' : 'liquid-ice-button portal-button'}
          type="button"
          disabled={action.pending}
          onClick={() => action.execute({ action: 'authenticate-options' })}
        >
          {C.VERIFY}
        </button>
      ) : null}
      {action.codes.length ? <RecoveryCodes codes={action.codes} /> : null}
      {!state.enabled && !state.credentials.length && supported ? (
        <RegisterDevice action={action} />
      ) : null}
      {!state.enabled && state.credentials.length > 0 ? (
        <RecoveryForm action={action} activate />
      ) : null}
      <RecoveryAccess state={state} action={action} />
      <VerifiedAdministration state={state} />
      {state.credentials.length > 0 && state.verified ? (
        <SecurityManagement state={state} action={action} />
      ) : null}
    </>
  );
}

function VerifiedAdministration({ state }: { readonly state: AdministratorSecurityState }) {
  return (
    <>
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
    </>
  );
}

function RecoveryAccess({
  state,
  action,
}: {
  readonly state: AdministratorSecurityState;
  readonly action: DeviceSecurity;
}) {
  return state.enabled && !state.verified ? (
    <details className="portal-details">
      <summary>{C.RECOVER}</summary>
      <RecoveryForm action={action} />
    </details>
  ) : null;
}
