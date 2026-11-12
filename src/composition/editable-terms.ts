import 'server-only';
import { headers } from 'next/headers';
import { portal } from './portal';
import { MEMBER_ROLES } from '../config/constants';
export async function editableTermsUrl(id: string, activityId: string) {
  const app = portal(await headers());
  if (!app.ok) return undefined;
  const org = await app.value.organizations.get(id);
  return org.ok && org.value.role === MEMBER_ROLES.OWNER
    ? `/app/${id}/activites/${activityId}?edit=terms#activity-edit`
    : undefined;
}
