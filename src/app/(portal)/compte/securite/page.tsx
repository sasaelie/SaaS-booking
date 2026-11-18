import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { ADMIN_SECURITY as C } from '../../../../config/administrator-security';
import { PortalError } from '../../../_portal/PortalError';
import { AdministratorSecurity } from '../../../_portal/administrator-security/AdministratorSecurity';
export default async function SecurityPage() {
  const services = portal(new Headers(await headers()));
  const result = services.ok ? await services.value.security.read() : null;
  if (!result?.ok) return <PortalError />;
  return (
    <section className="administrator-security">
      <h1>{C.TITLE}</h1>
      <p className="portal-intro">{C.INTRO}</p>
      <AdministratorSecurity key={result.value.contextKey} state={result.value} />
    </section>
  );
}
