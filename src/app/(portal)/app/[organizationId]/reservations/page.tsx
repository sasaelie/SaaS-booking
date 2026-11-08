import { headers } from 'next/headers';
import { portal } from '../../../../../composition/portal';
import { PORTAL } from '../../../../../config/constants';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { BookingFilters } from '../../../../_portal/BookingFilters';
import { BookingCards } from '../../../../_portal/BookingCards';
import { PortalEmpty } from '../../../../_portal/PortalEmpty';
import { Pagination } from '../../../../_portal/Pagination';
interface Props {
  readonly params: Promise<{ organizationId: string }>;
  readonly searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}
export default async function Page({ params, searchParams }: Props) {
  const { organizationId } = await params;
  const filter = await searchParams;
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const [organization, result] = await Promise.all([
    services.value.organizations.get(organizationId),
    services.value.workspace.bookings({ organizationId, filter }),
  ]);
  if (!organization.ok || !result.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={PORTAL.BOOKINGS} description={PORTAL.BOOKING_HINT} />
      <BookingFilters search={filter.search ?? ''} status={filter.status ?? ''} />
      {result.value.bookings.length ? (
        <BookingCards
          bookings={result.value.bookings}
          organizationId={organizationId}
          timezone={organization.value.timezone}
        />
      ) : (
        <PortalEmpty title={PORTAL.NO_BOOKINGS} />
      )}
      <Pagination
        page={result.value.page}
        total={result.value.total}
        path={`/app/${organizationId}/reservations`}
        search={filter.search}
        status={filter.status}
      />
    </>
  );
}
