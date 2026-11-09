import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { portal } from '../../../composition/portal';
import { PLATFORM_UI } from '../../../config/constants';
import { PortalError } from '../../_portal/PortalError';
import { AdministrationNav } from '../../_portal/AdministrationNav';
export default async function Layout({ children }: { readonly children: ReactNode }) {
  const services = portal(new Headers(await headers()));
  const access = services.ok ? await services.value.platform.permitted() : null;
  if (!access?.ok || !access.value) return <PortalError message={PLATFORM_UI.DENIED} />;
  return (
    <>
      <AdministrationNav />
      {children}
    </>
  );
}
