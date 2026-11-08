import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { portal } from '../../composition/portal';
import { PortalShell } from '../_portal/PortalShell';
import { PortalError } from '../_portal/PortalError';
export const dynamic = 'force-dynamic';
export default async function PortalLayout({ children }: { readonly children: ReactNode }) {
  const services = portal(new Headers(await headers()));
  if (!services.ok)
    return (
      <main>
        <PortalError />
      </main>
    );
  const actor = await services.value.session.execute();
  if (!actor.ok) redirect('/connexion');
  const [organizations, operator] = await Promise.all([
    services.value.organizations.list(),
    services.value.platform.permitted(),
  ]);
  if (!organizations.ok)
    return (
      <main>
        <PortalError />
      </main>
    );
  return (
    <PortalShell
      actor={actor.value}
      organizations={organizations.value}
      operator={operator.ok && operator.value}
    >
      {children}
    </PortalShell>
  );
}
