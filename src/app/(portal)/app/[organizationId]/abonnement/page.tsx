import { OnlineVoucher } from '../../../../_portal/OnlineVoucher';
import { headers } from 'next/headers';
import { portal } from '../../../../../composition/portal';
import { FinancialCounter } from '../../../../_portal/FinancialCounter';
import { LibertySelection } from '../../../../_portal/LibertySelection';
import { BILLING_UI } from '../../../../../config/constants';
import { loadWorkspace, type WorkspacePageProps } from '../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { SubscriptionPanel } from '../../../../_portal/SubscriptionPanel';
import { RefreshButton } from '../../../../_portal/RefreshButton';
export default async function Page({
  params,
  searchParams,
}: WorkspacePageProps & { readonly searchParams: Promise<{ retour?: string }> }) {
  const returned = (await searchParams).retour === 'paiement';
  const { organizationId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const services = portal(await headers());
  const summary = services.ok ? await services.value.financial.summary(organizationId) : null;
  return (
    <>
      <PortalHeading
        title={BILLING_UI.TITLE}
        description={BILLING_UI.INTRO}
        action={<RefreshButton />}
      />
      <div className="portal-list">
        <SubscriptionPanel organization={result.value.organization} />
        {summary?.ok ? <FinancialCounter summary={summary.value} /> : null}
        <LibertySelection data={result.value} />
        <OnlineVoucher organization={result.value.organization} />
      </div>
      {returned ? <p className="portal-muted">{BILLING_UI.STRIPE_PENDING}</p> : null}
    </>
  );
}
