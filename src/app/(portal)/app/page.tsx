import { headers } from 'next/headers';
import Link from 'next/link';
import { portal } from '../../../composition/portal';
import { PORTAL } from '../../../config/constants';
import { PortalHeading } from '../../_portal/PortalHeading';
import { PortalError } from '../../_portal/PortalError';
import { PortalEmpty } from '../../_portal/PortalEmpty';
import { OrganizationCards } from '../../_portal/OrganizationCards';
export default async function Page() {
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const organizations = await services.value.organizations.list();
  if (!organizations.ok) return <PortalError />;
  const action = (
    <Link className="liquid-ice-button portal-button" href="/app/nouveau">
      {PORTAL.CREATE_ORGANIZATION}
    </Link>
  );
  return (
    <>
      <PortalHeading
        title={PORTAL.ORGANIZATIONS}
        description={PORTAL.WELCOME_HINT}
        action={action}
      />
      {organizations.value.length ? (
        <OrganizationCards organizations={organizations.value} />
      ) : (
        <PortalEmpty title={PORTAL.NO_ORGANIZATIONS} description={PORTAL.WELCOME_HINT}>
          {action}
        </PortalEmpty>
      )}
    </>
  );
}
