import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentVisitor } from '../../composition/current-visitor';
import { planPath, readPlanIntent } from '../../lib/plan-selection';
import type { AuthMode } from './auth-request';
import { AuthForm } from './AuthForm';
import { ParticipantLogin } from './ParticipantLogin';
import { publicTestEnabled } from '../../config/public-test';
export type AuthEntryProps = {
  readonly searchParams: Promise<{ formule?: unknown; acces?: unknown }>;
};
export async function AuthEntry({
  mode,
  searchParams,
}: AuthEntryProps & { readonly mode: AuthMode }) {
  const params = await searchParams;
  const plan = readPlanIntent(params.formule);
  if (publicTestEnabled()) return <ParticipantLogin plan={null} participantOnly />;
  if (mode === 'SIGN_IN' && params.acces === 'participant') return <ParticipantLogin plan={plan} />;
  if (mode === 'SIGN_IN' || mode === 'SIGN_UP') {
    if (await currentVisitor(new Headers(await headers()))) redirect(planPath('/app', plan));
  }
  return <AuthForm mode={mode} plan={plan} />;
}
