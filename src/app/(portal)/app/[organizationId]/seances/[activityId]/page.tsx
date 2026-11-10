import { headers } from 'next/headers';
import { portal } from '../../../../../../composition/portal';
import { PortalError } from '../../../../../_portal/PortalError';
import { SessionDetails } from '../../../../../_portal/SessionDetails';
interface Props {
  readonly params: Promise<{ organizationId: string; activityId: string }>;
  readonly searchParams: Promise<{ startsAt?: string; page?: string }>;
}
export default async function Page({ params, searchParams }: Props) {
  const route = await params;
  const query = await searchParams;
  const input = { ...route, startsAt: query.startsAt, page: query.page };
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const result = await services.value.workspace.sessionDetails(input);
  return result.ok ? <SessionDetails data={result.value} /> : <PortalError />;
}
