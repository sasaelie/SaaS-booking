import { z } from 'zod';
import { EventDetailsSchema } from './event-details';
import {
  AUDIENCE_POLICIES,
  PAYMENT_MODES,
  BOOKING_LIMITS,
  INPUT_LIMITS,
  SAAS,
  TIME,
} from '../../config/constants';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const capacity = z.number().int().min(1).max(INPUT_LIMITS.MAX_CAPACITY);
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const weeklySlot = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(0)
      .max(TIME.DAYS_PER_WEEK - 1),
    startTimeLocal: time,
    endTimeLocal: time,
    capacity,
  })
  .refine((v) => v.endTimeLocal > v.startTimeLocal);
export const ManualScheduleSchema = z.object({
  kind: z.literal('MANUAL'),
  date: localDate,
  endDate: localDate,
  start: time,
  end: time,
  capacity,
});
export const CreateActivitySchema = EventDetailsSchema.extend({
  organizationId: z.uuid(),
  name: z.string().trim().min(INPUT_LIMITS.NAME_MIN).max(INPUT_LIMITS.NAME_MAX),
  description: z.string().trim().max(SAAS.MAX_DESCRIPTION).default(''),
  priceCents: z.number().int().min(0).max(INPUT_LIMITS.MAX_CENTS),
  audiencePolicy: z.enum(AUDIENCE_POLICIES),
  paymentMode: z.enum(PAYMENT_MODES),
  requirePhone: z.boolean(),
  bookingWindowWeeks: z
    .number()
    .int()
    .min(BOOKING_LIMITS.MIN_BOOKING_WINDOW_WEEKS)
    .max(BOOKING_LIMITS.MAX_BOOKING_WINDOW_WEEKS),
  noticeHoursForVoucher: z.number().int().min(0).max(INPUT_LIMITS.MAX_RANGE_DAYS),
  voucherValidityMonths: z.number().int().min(1).max(BOOKING_LIMITS.MAX_BOOKING_WINDOW_WEEKS),
  schedule: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('WEEKLY'),
      slots: z.array(weeklySlot).min(1).max(SAAS.MAX_WEEKLY_SLOTS),
    }),
    ManualScheduleSchema,
  ]),
});
export type ValidatedActivity = z.output<typeof CreateActivitySchema>;

export const UpdateActivitySchema = CreateActivitySchema.omit({ schedule: true }).extend({
  activityId: z.uuid(),
});
export const AddSessionSchema = z.object({
  organizationId: z.uuid(),
  activityId: z.uuid(),
  schedule: ManualScheduleSchema,
});
export const RecordRefundSchema = z.object({
  organizationId: z.uuid(),
  bookingId: z.uuid(),
  reference: z.string().trim().min(1).max(INPUT_LIMITS.KEY_MAX),
});
