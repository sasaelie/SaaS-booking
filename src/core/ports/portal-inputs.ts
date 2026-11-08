import type { AudiencePolicy, PaymentMode } from '../../config/constants';
export interface CreateOrganizationInput {
  readonly name: string;
  readonly slug: string;
  readonly kind: string;
  readonly timezone: string;
}
export interface WeeklySlotInput {
  readonly dayOfWeek: number;
  readonly startTimeLocal: string;
  readonly endTimeLocal: string;
  readonly capacity: number;
}
export interface CreateActivityInput {
  readonly organizationId: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly audiencePolicy: AudiencePolicy;
  readonly paymentMode: PaymentMode;
  readonly requirePhone: boolean;
  readonly bookingWindowWeeks: number;
  readonly noticeHoursForVoucher: number;
  readonly voucherValidityMonths: number;
  readonly schedule:
    | { readonly kind: 'WEEKLY'; readonly slots: readonly WeeklySlotInput[] }
    | {
        readonly kind: 'MANUAL';
        readonly startsAt: Date;
        readonly endsAt: Date;
        readonly capacity: number;
      };
}
export interface OrganizationSettingsInput {
  readonly organizationId: string;
  readonly name: string;
  readonly bankIban: string | null;
  readonly bankAccountName: string | null;
  readonly theme: string;
  readonly autoDeleteBankProof: boolean;
}
export interface BookingFilter {
  readonly activityId?: string;
  readonly page: number;
  readonly search: string;
  readonly status: string;
}
export interface PlatformFilter {
  readonly page: number;
  readonly search: string;
}

export type UpdateActivityInput = Omit<CreateActivityInput, 'schedule'> & {
  readonly activityId: string;
};
export interface AddManualSessionInput {
  readonly organizationId: string;
  readonly activityId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly capacity: number;
}
