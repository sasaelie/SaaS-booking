import type {
  OrganizationSummary,
  PortalActivity,
  PortalSession,
  PortalBookingPage,
} from './portal-models';
export interface SessionDetails {
  readonly organization: OrganizationSummary;
  readonly activity: Pick<
    PortalActivity,
    'id' | 'name' | 'description' | 'priceCents' | 'currency' | 'address' | 'practicalInfo'
  >;
  readonly session: PortalSession;
  readonly bookings: PortalBookingPage;
}
