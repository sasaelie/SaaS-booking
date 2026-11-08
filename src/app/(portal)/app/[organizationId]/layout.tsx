import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { PORTAL } from '../../../../config/constants';
import { PortalError } from '../../../_portal/PortalError';
import { AccessNotice } from '../../../_portal/AccessNotice';
export default async function Layout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const organization = await services.value.organizations.get(organizationId);
  if (!organization.ok) return <PortalError message={PORTAL.ORGANIZATION_ERROR} />;
  return (
    <>
      <AccessNotice organization={organization.value} />
      {children}
    </>
  );
}
