import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentVisitor } from '../../composition/current-visitor';
import { planPath, readPlanIntent } from '../../lib/plan-selection';
import type { AuthMode } from './auth-request';
import { AuthForm } from './AuthForm';
export type AuthEntryProps = { readonly searchParams: Promise<{ formule?: unknown }> };
export async function AuthEntry({
  mode,
  searchParams,
}: AuthEntryProps & { readonly mode: AuthMode }) {
  const plan = readPlanIntent((await searchParams).formule);
  if (mode === 'SIGN_IN' || mode === 'SIGN_UP') {
    if (await currentVisitor(new Headers(await headers()))) redirect(planPath('/app', plan));
  }
  return <AuthForm mode={mode} plan={plan} />;
}
