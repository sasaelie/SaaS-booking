'use client';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ADMIN_CODES } from '../../../config/administrator-codes';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import type { DeviceSecurity } from './use-device-security';
import { RegisterDevice } from './SecurityForms';
type Props = {
  readonly state: AdministratorSecurityState;
  readonly action: DeviceSecurity;
  readonly supported: boolean | null;
};
export function PasskeyMethod({ state, action, supported }: Props) {
  if (supported === null) return <p role="status">{ADMIN_CODES.CHECKING}</p>;
  return (
    <section className="administrator-method-content">
      <h2>{ADMIN_CODES.PASSKEY}</h2>
      <p>{C.DEVICE}</p>
      <p className="portal-muted">{C.ORIGIN_NOTE}</p>
      {!supported ? (
        <p role="status">{ADMIN_CODES.BIOMETRIC_UNAVAILABLE}</p>
      ) : (
        <>
          {state.credentials.length > 0 ? (
            <button
              className={
                state.verified ? 'portal-secondary-action' : 'liquid-ice-button portal-button'
              }
              type="button"
              disabled={action.pending}
              onClick={() => action.execute({ action: 'authenticate-options' })}
            >
              {C.VERIFY}
            </button>
          ) : null}
          {(!state.enabled || state.verified) &&
            (!state.credentials.length ? (
              <RegisterDevice action={action} />
            ) : (
              <details className="portal-details">
                <summary>{C.ADD}</summary>
                <RegisterDevice action={action} additional />
              </details>
            ))}
          {state.enabled && !state.verified && !state.credentials.length ? (
            <p>{ADMIN_CODES.METHOD_NOT_READY}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
