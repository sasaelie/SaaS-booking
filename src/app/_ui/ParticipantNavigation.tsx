import Link from 'next/link';
import { headers } from 'next/headers';
import { portal } from '../../composition/portal';
import { PARTICIPANT_NAV as UI } from '../../config/participant-navigation';
export async function ParticipantNavigation({
  organizationId,
  slug,
  from,
  catalog = false,
}: {
  readonly organizationId: string;
  readonly slug: string;
  readonly from?: string;
  readonly catalog?: boolean;
}) {
  const services = portal(new Headers(await headers()));
  const organization = services.ok ? await services.value.organizations.get(organizationId) : null;
  const own = organization?.ok;
  const appearance = from === UI.SOURCE;
  const href = own
    ? `/app/${organizationId}${appearance ? '/parametres' : ''}`
    : catalog
      ? '/'
      : `/${slug}`;
  const label = own
    ? appearance
      ? UI.RETURN_APPEARANCE
      : UI.RETURN_ORGANIZER
    : catalog
      ? UI.HOME
      : UI.RETURN_ACTIVITIES;
  return (
    <div className="participant-navigation">
      <Link href={href}>← {label}</Link>
    </div>
  );
}
