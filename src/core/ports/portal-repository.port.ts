import type { ManualVoucherInput } from '../validation/manual-voucher';
import type { PlatformOperationsPage, PlatformHistoryPage } from './platform-monitoring';
import type { AppearanceInput } from '../validation/appearance';
import type { UpdateActivityInput, AddManualSessionInput } from './portal-inputs';
import type { Result } from '../../lib/result';
import type {
  OrganizationSummary,
  PortalOverview,
  PortalBookingPage,
  PlatformOverview,
  PortalActor,
} from './portal-models';
import type {
  CreateOrganizationInput,
  CreateActivityInput,
  OrganizationSettingsInput,
  BookingFilter,
  PlatformFilter,
} from './portal-inputs';
export interface PortalRepositoryPort {
  issueManualVoucher(actor: PortalActor, input: ManualVoucherInput): Promise<Result<void>>;
  listOrganizations(actor: PortalActor): Promise<Result<readonly OrganizationSummary[]>>;
  createOrganization(
    actor: PortalActor,
    input: CreateOrganizationInput,
  ): Promise<Result<{ readonly organizationId: string }>>;
  getOrganization(actor: PortalActor, organizationId: string): Promise<Result<OrganizationSummary>>;
  overview(actor: PortalActor, organizationId: string): Promise<Result<PortalOverview>>;
  bookings(
    actor: PortalActor,
    organizationId: string,
    filter: BookingFilter,
  ): Promise<Result<PortalBookingPage>>;
  createActivity(
    actor: PortalActor,
    input: CreateActivityInput,
  ): Promise<Result<{ readonly activityId: string }>>;
  archiveActivity(
    actor: PortalActor,
    organizationId: string,
    activityId: string,
  ): Promise<Result<void>>;
  updateAppearance(actor: PortalActor, input: AppearanceInput): Promise<Result<void>>;
  updateSettings(actor: PortalActor, input: OrganizationSettingsInput): Promise<Result<void>>;
  platformOperations(
    actor: PortalActor,
    filter: PlatformFilter,
  ): Promise<Result<PlatformOperationsPage>>;
  platformHistory(actor: PortalActor, filter: PlatformFilter): Promise<Result<PlatformHistoryPage>>;
  isPlatformOperator(actor: PortalActor): Promise<Result<boolean>>;
  platform(actor: PortalActor, filter: PlatformFilter): Promise<Result<PlatformOverview>>;
  grantAccess(
    actor: PortalActor,
    organizationId: string,
    complimentary: boolean,
  ): Promise<Result<void>>;
  suspend(actor: PortalActor, organizationId: string, suspended: boolean): Promise<Result<void>>;
  updateActivity(
    actor: PortalActor,
    input: UpdateActivityInput,
  ): Promise<Result<{ readonly activityId: string }>>;
  addSession(actor: PortalActor, input: AddManualSessionInput): Promise<Result<void>>;
  publishActivity(actor: PortalActor, id: string, activityId: string): Promise<Result<void>>;
  recordBankRefund(
    actor: PortalActor,
    id: string,
    bookingId: string,
    reference: string,
  ): Promise<Result<void>>;
}
