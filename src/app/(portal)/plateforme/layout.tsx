import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { portal } from '../../../composition/portal';
import { PLATFORM_UI } from '../../../config/constants';
import { PortalError } from '../../_portal/PortalError';
import { AdministrationNav } from '../../_portal/AdministrationNav';
import { redirect } from 'next/navigation';
import { ADMIN_SECURITY } from '../../../config/administrator-security';
export default async function Layout({ children }: { readonly children: ReactNode }) {
  const services = portal(new Headers(await headers()));
  const access = services.ok ? await services.value.platform.permitted() : null;
  if (!access?.ok || !access.value) return <PortalError message={PLATFORM_UI.DENIED} />;
  const security = services.ok ? await services.value.security.read() : null;
  if (!security?.ok) return <PortalError />;
  if (security.value.enabled && !security.value.verified) redirect(ADMIN_SECURITY.PATH);
  return (
    <>
      <AdministrationNav />
      {children}
    </>
  );
}
