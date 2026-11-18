'use client';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
import type { DeviceSecurity } from './use-device-security';
import { PrepareCodeMethod, OtpForm, useEmailCooldown } from './CodeForms';
type Props = { readonly state: AdministratorSecurityState; readonly action: DeviceSecurity };
export function EmailMethod({ state, action }: Props) {
  const remaining = useEmailCooldown(action.emailState.next ?? state.emailNextSendAt);
  const canConfigure = !state.enabled || state.verified;
  return (
    <section className="administrator-method-content">
      <h2>{C.EMAIL}</h2>
      <p className="portal-muted">{C.EMAIL_NOTE}</p>
      <p>{state.emailAddress}</p>
      {!state.emailAvailable ? (
        <p role="status">{C.EMAIL_UNAVAILABLE}</p>
      ) : (
        <>
          {state.emailEnabled ? (
            <>
              <p className="portal-muted">{C.EMAIL_ACTIVE}</p>
              <button
                className="liquid-ice-button portal-button"
                type="button"
                disabled={action.pending || remaining > 0}
                onClick={() => action.execute({ action: 'email-send' })}
              >
                {C.EMAIL_SEND}
              </button>
            </>
          ) : canConfigure ? (
            <PrepareCodeMethod method="email" action={action} label={C.EMAIL_SETUP} />
          ) : (
            <p>{C.METHOD_NOT_READY}</p>
          )}
          <EmailWait remaining={remaining} />
          {action.emailState.sent ? <p role="status">{C.EMAIL_SENT}</p> : null}
          <EmailVerification state={state} action={action} />
        </>
      )}
    </section>
  );
}

function EmailVerification({ state, action }: Props) {
  return (
    <>
      {(action.emailState.sent || state.emailEnabled) && (
        <>
          <p className="portal-muted">{C.EMAIL_EXPIRY}</p>
          <OtpForm
            action={action}
            operation={state.emailEnabled ? 'email-verify' : 'email-confirm'}
            label={C.EMAIL_VERIFY}
          />
        </>
      )}
    </>
  );
}

function EmailWait({ remaining }: { readonly remaining: number }) {
  return (
    <>
      {remaining > 0 ? (
        <p className="portal-muted" aria-live="off">
          {C.EMAIL_RETRY} {remaining} s.
        </p>
      ) : null}
    </>
  );
}
