import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { portal } from '../../composition/portal';
import { planPath, readPlanIntent } from '../../lib/plan-selection';
import type { AuthMode } from './auth-request';
import { AuthForm } from './AuthForm';
export type AuthEntryProps = { readonly searchParams: Promise<{ formule?: unknown }> };
export async function AuthEntry({
  mode,
  searchParams,
}: AuthEntryProps & { readonly mode: AuthMode }) {
  const plan = readPlanIntent((await searchParams).formule);
  if (plan && (mode === 'SIGN_IN' || mode === 'SIGN_UP')) {
    const services = portal(new Headers(await headers()));
    if (services.ok && (await services.value.session.execute()).ok)
      redirect(planPath('/app', plan));
  }
  return <AuthForm mode={mode} plan={plan} />;
}
