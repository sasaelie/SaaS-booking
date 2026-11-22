import { AccountingWorkbookAdapter } from '../adapters/accounting/workbook.adapter';
import { ManualVoucherUseCase } from '../core/use-cases/portal/manual-voucher.use-case';
import { LocalPauseUseCase } from '../core/use-cases/portal/local-pause.use-case';
import { ConnectUseCase } from '../core/use-cases/portal/connect.use-case';
import { connectGateway } from './connect';
import { ManageActivityUseCase } from '../core/use-cases/portal/manage-activity.use-case';
import { BookingPublicationUseCase } from '../core/use-cases/portal/booking-publication.use-case';
import { DrizzleBookingPublicationRepository } from '../adapters/db/drizzle-booking-publication.repository';
import { ShareUseCase } from '../core/use-cases/portal/share.use-case';
import { QrCodeAdapter } from '../adapters/share/qr-code.adapter';
import 'server-only';
import { runtime, type Runtime } from './runtime';
import { authentication } from './authentication';
import { subscriptions } from './subscriptions';
import { DrizzlePortalRepository } from '../adapters/db/drizzle-portal.repository';
import { SessionIdentityAdapter } from '../adapters/auth/session-identity.adapter';
import { MembershipAuthorizationAdapter } from '../adapters/auth/membership-authorization.adapter';
import { PortalSessionUseCase } from '../core/use-cases/portal/session.use-case';
import { OrganizationsUseCase } from '../core/use-cases/portal/organizations.use-case';
import { ActivitiesUseCase } from '../core/use-cases/portal/activities.use-case';
import { ReadWorkspaceUseCase } from '../core/use-cases/portal/read-workspace.use-case';
import { PlatformUseCase } from '../core/use-cases/portal/platform.use-case';
import { SubscriptionUseCase } from '../core/use-cases/portal/subscription.use-case';
import { administration } from './administration';
import { ok } from '../lib/result';
import { FinancialUseCase } from '../core/use-cases/portal/financial.use-case';
import { DrizzleFinancialRepository } from '../adapters/db/drizzle-financial.repository';
import { DrizzlePlatformReportingRepository } from '../adapters/db/drizzle-platform-reporting.repository';
import { PlatformReportingUseCase } from '../core/use-cases/portal/platform-reporting.use-case';
import { PlatformExportAdapter } from '../adapters/accounting/platform-export.adapter';
import { PlatformSettingsUseCase } from '../core/use-cases/portal/platform-settings.use-case';
import { DrizzlePlatformSettingsRepository } from '../adapters/db/drizzle-platform-settings.repository';
import { platformBilling } from './platform-billing';
import { administratorSecurity } from './administrator-security';
import { RecordedPaymentUseCase } from '../core/use-cases/portal/recorded-payment.use-case';
import { DrizzleRecordedPaymentRepository } from '../adapters/db/drizzle-recorded-payment.repository';
import { DrizzleSessionEditRepository } from '../adapters/db/drizzle-session-edit.repository';
import { SessionEditUseCase } from '../core/use-cases/portal/session-edit.use-case';
export function portal(headers: Headers) {
  const app = runtime();
  if (!app.ok) return app;
  const auth = authentication();
  if (!auth.ok) return auth;
  const identity = new SessionIdentityAdapter(auth.value, headers);
  const repository = new DrizzlePortalRepository(app.value.db);
  const authorization = new MembershipAuthorizationAdapter(identity, repository);
  const admin = administration(app.value, '', authorization);
  return ok({
    ...recordedPayments(app.value, identity, repository),
    security: administratorSecurity(app.value, auth.value, identity, headers),
    ...platformReports(app.value, identity),
    financial: new FinancialUseCase(
      identity,
      new DrizzleFinancialRepository(app.value.db),
      new AccountingWorkbookAdapter(),
    ),
    manualVoucher: new ManualVoucherUseCase(identity, repository),
    pause: new LocalPauseUseCase(identity, repository, admin.pause),
    session: new PortalSessionUseCase(identity),
    connect: new ConnectUseCase(identity, connectGateway(app.value)),
    ...sharing(app.value, identity, repository),
    organizations: new OrganizationsUseCase(identity, repository),
    activities: new ActivitiesUseCase(identity, repository),
    management: new ManageActivityUseCase(identity, repository),
    workspace: new ReadWorkspaceUseCase(identity, repository),
    platform: new PlatformUseCase(identity, repository),
    subscription: new SubscriptionUseCase(identity, subscriptions(app.value).gateway),
    administration: admin,
    runner: app.value.runner,
  });
}
export type PortalServices = Extract<ReturnType<typeof portal>, { ok: true }>['value'];
function recordedPayments(
  app: Runtime,
  identity: SessionIdentityAdapter,
  repository: DrizzlePortalRepository,
) {
  return {
    sessionEdit: new SessionEditUseCase(
      identity,
      repository,
      new DrizzleSessionEditRepository(app.db),
    ),
    recordedPayment: new RecordedPaymentUseCase(
      identity,
      new DrizzleRecordedPaymentRepository(app.db),
    ),
  };
}
function publicationSettings(app: Runtime) {
  return {
    PUBLIC_BOOKING_URL: app.env.PUBLIC_BOOKING_URL,
    PUBLIC_BOOKING_ORGANIZATION_ID: app.env.PUBLIC_BOOKING_ORGANIZATION_ID,
  };
}

function platformReports(app: Runtime, identity: SessionIdentityAdapter) {
  return {
    settings: new PlatformSettingsUseCase(identity, new DrizzlePlatformSettingsRepository(app.db)),
    billing: platformBilling(app, identity),
    reporting: new PlatformReportingUseCase(
      identity,
      new DrizzlePlatformReportingRepository(app.db),
      new PlatformExportAdapter(),
    ),
  };
}

function sharing(
  app: Runtime,
  identity: SessionIdentityAdapter,
  repository: DrizzlePortalRepository,
) {
  const publication = new BookingPublicationUseCase(
    identity,
    new DrizzleBookingPublicationRepository(app.db, app.env),
  );
  return {
    publication,
    share: new ShareUseCase(
      identity,
      repository,
      new QrCodeAdapter(),
      app.env.NEXT_PUBLIC_APP_URL,
      publicationSettings(app),
      publication,
    ),
  };
}
