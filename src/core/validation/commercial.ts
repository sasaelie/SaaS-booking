import { z } from 'zod';
import { COMMERCIAL, type CommercialPlan } from '../../config/commercial';
import { INPUT_LIMITS } from '../../config/constants';
export const CommercialQuoteSchema = z.object({
  amountCents: z.number().int().min(0).max(INPUT_LIMITS.MAX_CENTS),
  plan: z.enum([COMMERCIAL.LIBERTE, COMMERCIAL.PRO, COMMERCIAL.LEGACY]),
});
export const LibertySelectionSchema = z.object({
  organizationId: z.uuid(),
  activityIds: z
    .array(z.uuid())
    .max(COMMERCIAL.LIBERTE_ACTIVITY_LIMIT)
    .refine((ids) => new Set(ids).size === ids.length),
});
export const SubscriptionInputSchema = z.object({
  organizationId: z.uuid(),
  operation: z.enum(['checkout', 'cancel', 'reactivate', 'billingPortal']),
  interval: z.enum(['month', 'year']).default('month'),
});
export const PlatformCostSchema = z.object({
  organizationId: z.uuid(),
  category: z.enum(['CONNECT', 'DISPUTE', 'CONVERSION', 'OTHER']),
  amountCents: z.number().int().positive().max(INPUT_LIMITS.MAX_CENTS),
  sourceReference: z.string().trim().min(1).max(INPUT_LIMITS.KEY_MAX),
  occurredAt: z.iso.datetime(),
});
export type PlatformCostInput = z.infer<typeof PlatformCostSchema>;
export interface CommercialQuote {
  readonly plan: CommercialPlan;
  readonly amountCents: number;
  readonly commissionCents: number;
  readonly organizationNetCents: number | null;
  readonly ruleVersion: string;
}

export const OnlineVoucherSchema = z.object({
  organizationId: z.uuid(),
  code: z.string().trim().min(1).max(INPUT_LIMITS.KEY_MAX),
});
