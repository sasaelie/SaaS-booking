import { issueManualVoucher } from './portal/manual-voucher';
import { portalSessionDetails } from './portal/session-details';
import type { SessionDetailsInput } from '../../core/validation/session-details';
import type { ManualVoucherInput } from '../../core/validation/manual-voucher';
import { platformHistory, platformOperations } from './portal/platform-monitoring';
import type { AppearanceInput } from '../../core/validation/appearance';
import {
  updateActivity,
  addSession,
  publishActivity,
  recordBankRefund,
} from './portal/activity-management';
import type { UpdateActivityInput, AddManualSessionInput } from '../../core/ports/portal-inputs';
import type { PortalRepositoryPort } from '../../core/ports/portal-repository.port';
import type { PortalActor } from '../../core/ports/portal-models';
import type {
  CreateOrganizationInput,
  CreateActivityInput,
  OrganizationSettingsInput,
  BookingFilter,
  PlatformFilter,
} from '../../core/ports/portal-inputs';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { ok } from '../../lib/result';
import { listOrganizations, getOrganization, createOrganization } from './portal/organizations';
import { portalOverview } from './portal/overview';
import { portalBookings } from './portal/bookings';
import { createActivity, archiveActivity } from './portal/activities';
import { updateSettings, updateAppearance } from './portal/settings';
import { isPlatformOperator } from './portal/authorization';
import { platformOverview, setPlatformAccess } from './portal/platform';
export class DrizzlePortalRepository implements PortalRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  sessionDetails(actor: PortalActor, input: SessionDetailsInput) {
    return atomic(this.db, 'SessionDetails', (tx) => portalSessionDetails(tx, actor, input));
  }
  issueManualVoucher(actor: PortalActor, input: ManualVoucherInput) {
    return atomic(this.db, 'ManualVoucher', (tx) => issueManualVoucher(tx, actor, input));
  }
  listOrganizations(actor: PortalActor) {
    return atomic(this.db, 'Organizations', (tx) => listOrganizations(tx, actor));
  }
  getOrganization(actor: PortalActor, id: string) {
    return atomic(this.db, 'Organization', (tx) => getOrganization(tx, actor, id));
  }
  createOrganization(actor: PortalActor, input: CreateOrganizationInput) {
    return atomic(this.db, 'Organization', (tx) => createOrganization(tx, actor, input));
  }
  overview(actor: PortalActor, id: string) {
    return atomic(this.db, 'Workspace', (tx) => portalOverview(tx, actor, id));
  }
  bookings(actor: PortalActor, id: string, filter: BookingFilter) {
    return atomic(this.db, 'Bookings', (tx) => portalBookings(tx, actor, id, filter));
  }
  createActivity(actor: PortalActor, input: CreateActivityInput) {
    return atomic(this.db, 'Activity', (tx) => createActivity(tx, actor, input));
  }
  archiveActivity(actor: PortalActor, id: string, activityId: string) {
    return atomic(this.db, 'Activity', (tx) => archiveActivity(tx, actor, id, activityId));
  }
  updateAppearance(actor: PortalActor, input: AppearanceInput) {
    return atomic(this.db, 'Appearance', (tx) => updateAppearance(tx, actor, input));
  }
  updateSettings(actor: PortalActor, input: OrganizationSettingsInput) {
    return atomic(this.db, 'Settings', (tx) => updateSettings(tx, actor, input));
  }
  platformOperations(actor: PortalActor, filter: PlatformFilter) {
    return atomic(this.db, 'Platform', (tx) => platformOperations(tx, actor, filter));
  }
  platformHistory(actor: PortalActor, filter: PlatformFilter) {
    return atomic(this.db, 'Platform', (tx) => platformHistory(tx, actor, filter));
  }
  isPlatformOperator(actor: PortalActor) {
    return atomic(this.db, 'Operator', async (tx) => ok(await isPlatformOperator(tx, actor)));
  }
  platform(actor: PortalActor, filter: PlatformFilter) {
    return atomic(this.db, 'Platform', (tx) => platformOverview(tx, actor, filter));
  }
  grantAccess(actor: PortalActor, id: string, complimentary: boolean) {
    return atomic(this.db, 'Platform', (tx) => setPlatformAccess(tx, actor, id, { complimentary }));
  }
  suspend(actor: PortalActor, id: string, suspended: boolean) {
    return atomic(this.db, 'Platform', (tx) =>
      setPlatformAccess(tx, actor, id, { suspendedAt: suspended ? new Date() : null }),
    );
  }
  updateActivity(actor: PortalActor, input: UpdateActivityInput) {
    return atomic(this.db, 'Activity', (tx) => updateActivity(tx, actor, input));
  }
  addSession(actor: PortalActor, input: AddManualSessionInput) {
    return atomic(this.db, 'Session', (tx) => addSession(tx, actor, input));
  }
  publishActivity(actor: PortalActor, id: string, activityId: string) {
    return atomic(this.db, 'Activity', (tx) => publishActivity(tx, actor, id, activityId));
  }
  recordBankRefund(actor: PortalActor, id: string, bookingId: string, reference: string) {
    return atomic(this.db, 'Refund', (tx) => recordBankRefund(tx, actor, id, bookingId, reference));
  }
}
