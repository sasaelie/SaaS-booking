import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { portal } from '../../../composition/portal';
import { PORTAL } from '../../../config/constants';
import { PortalHeading } from '../../_portal/PortalHeading';
import { PortalError } from '../../_portal/PortalError';
import { PortalEmpty } from '../../_portal/PortalEmpty';
import { OrganizationCards } from '../../_portal/OrganizationCards';
import { planEntryDestination, planPath, readPlanIntent } from '../../../lib/plan-selection';
import { PLAN_SELECTION as UI } from '../../../config/plan-selection';
import { MEMBER_ROLES } from '../../../config/constants';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ formule?: unknown }>;
}) {
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const organizations = await services.value.organizations.list();
  if (!organizations.ok) return <PortalError />;
  const plan = readPlanIntent((await searchParams).formule);
  if (plan) {
    const destination = planEntryDestination(organizations.value, plan);
    if (destination) redirect(destination);
  }
  const visible = plan
    ? organizations.value.filter((org) => org.role === MEMBER_ROLES.OWNER)
    : organizations.value;
  const action = (
    <Link className="liquid-ice-button portal-button" href={planPath('/app/nouveau', plan)}>
      {PORTAL.CREATE_ORGANIZATION}
    </Link>
  );
  return (
    <>
      <PortalHeading
        title={plan ? UI.CHOOSE_SPACE : PORTAL.ORGANIZATIONS}
        description={plan ? UI.SPACE_HINT : visible.length ? PORTAL.WELCOME_HINT : undefined}
        action={visible.length ? action : undefined}
      />
      {plan ? <p className="commercial-intent-note">{UI.CHOICE[plan]}</p> : null}
      {visible.length ? (
        <OrganizationCards organizations={visible} plan={plan} />
      ) : (
        <PortalEmpty title={PORTAL.NO_ORGANIZATIONS} description={PORTAL.WELCOME_HINT}>
          {action}
        </PortalEmpty>
      )}
    </>
  );
}
