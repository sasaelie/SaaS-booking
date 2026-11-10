import { getOrganization } from './organizations';
import { readActivity } from '../activity-reader';
import { portalBookings } from './bookings';
import type { Executor } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { SessionDetailsInput } from '../../../core/validation/session-details';
import { describePortalSession } from '../../../core/domain/portal-session';
import { ok } from '../../../lib/result';
export async function portalSessionDetails(
  db: Executor,
  actor: PortalActor,
  input: SessionDetailsInput,
) {
  const organization = await getOrganization(db, actor, input.organizationId);
  if (!organization.ok) return organization;
  const activity = await readActivity(db, input.organizationId, input.activityId);
  if (!activity.ok) return activity;
  const session = describePortalSession(activity.value, new Date(input.startsAt), new Date());
  if (!session.ok) return session;
  const bookings = await portalBookings(db, actor, input.organizationId, {
    activityId: input.activityId,
    sessionStartsAt: input.startsAt,
    page: input.page,
    search: '',
    status: '',
  });
  if (!bookings.ok) return bookings;
  const { id, name, description, priceCents, currency, address, practicalInfo } = activity.value;
  return ok({
    organization: organization.value,
    session: session.value,
    bookings: bookings.value,
    activity: {
      id,
      name,
      description: description ?? null,
      priceCents,
      currency,
      address,
      practicalInfo,
    },
  });
}
