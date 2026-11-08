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
  return (
    <>
      <PortalHeading
        title={BILLING_UI.TITLE}
        description={BILLING_UI.INTRO}
        action={<RefreshButton />}
      />
      <SubscriptionPanel organization={result.value.organization} />
      {returned ? <p className="portal-muted">{BILLING_UI.STRIPE_PENDING}</p> : null}
    </>
  );
}
