'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AppLink as Link } from '../_ui/AppLink';
import { PARTICIPANT_UI as UI, UI_MESSAGES, PARTICIPANT } from '../../config/constants';
import { exchangeParticipantCode } from '../manage/participant-exchange';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { AuthTabs } from './AuthTabs';
export function ParticipantLogin({
  plan,
  participantOnly = false,
}: {
  readonly plan: PlanIntent | null;
  readonly participantOnly?: boolean;
}) {
  const form = useParticipantLogin();
  return (
    <main className="portal-auth">
      <Link href="/">Retour à l’accueil</Link>
      <section className="ice-cube-shell portal-auth-card">
        {!participantOnly ? <AuthTabs plan={plan} client /> : null}
        <h1>{UI.LOGIN}</h1>
        <p>{UI.PRIVATE}</p>
        <form className="portal-form" onSubmit={form.submit} aria-busy={form.pending}>
          <label className="portal-field">
            {UI.CODE}
            <input
              className="portal-input"
              name="code"
              required
              maxLength={PARTICIPANT.CODE_MAX}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </label>
          <button className="liquid-ice-button portal-button" disabled={form.pending}>
            {form.pending ? UI.LOADING : UI.LOGIN}
          </button>
          {form.message ? <p role="alert">{form.message}</p> : null}
        </form>
      </section>
    </main>
  );
}
function useParticipantLogin() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const code = new FormData(event.currentTarget).get('code');
    setPending(true);
    setMessage('');
    try {
      const result = await exchangeParticipantCode(typeof code === 'string' ? code : '');
      if (result) router.push(result.path);
      else setMessage(UI.INVALID);
    } catch {
      setMessage(UI_MESSAGES.FAILURE);
    } finally {
      setPending(false);
    }
  }
  return { pending, message, submit };
}
