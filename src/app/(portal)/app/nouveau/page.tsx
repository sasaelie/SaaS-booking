import { PORTAL } from '../../../../config/constants';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { CreateOrganizationForm } from '../../../_portal/CreateOrganizationForm';
import { readPlanIntent } from '../../../../lib/plan-selection';
import { PLAN_SELECTION } from '../../../../config/plan-selection';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ formule?: unknown }>;
}) {
  const plan = readPlanIntent((await searchParams).formule);
  return (
    <>
      <PortalHeading title={PORTAL.CREATE_ORGANIZATION} description={PORTAL.WELCOME_HINT} />
      {plan ? <p className="commercial-intent-note">{PLAN_SELECTION.CHOICE[plan]}</p> : null}
      <CreateOrganizationForm appUrl={process.env['NEXT_PUBLIC_APP_URL'] ?? ''} plan={plan} />
    </>
  );
}
