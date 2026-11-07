import { z } from 'zod';
import { DEFAULTS, INPUT_LIMITS } from '../../config/constants';
export const StripeMetadataSchema = z.object({
  organization_id: z.uuid(),
  booking_id: z.uuid(),
});
export const StripeAmountSchema = z.number().int().positive().max(INPUT_LIMITS.MAX_CENTS);
export const StripeCurrencySchema = z.literal(DEFAULTS.CURRENCY.toLowerCase());
