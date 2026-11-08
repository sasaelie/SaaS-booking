import { z } from 'zod';
import { PORTAL, ERROR_CODES, ACTIVITY_UI } from '../../config/constants';
export const PortalResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  data: z
    .object({
      organizationId: z.string().optional(),
      activityId: z.string().optional(),
      url: z.url().nullable().optional(),
    })
    .optional(),
});
export function portalError(code: string | undefined): string {
  switch (code) {
    case ERROR_CODES.SLUG_UNAVAILABLE:
      return PORTAL.SLUG_UNAVAILABLE;
    case ERROR_CODES.RATE_LIMITED:
      return PORTAL.RATE_LIMITED;
    case ERROR_CODES.STRIPE_ACCOUNT_REQUIRED:
      return ACTIVITY_UI.STRIPE_SETUP;
    case ERROR_CODES.BANK_DETAILS_REQUIRED:
      return ACTIVITY_UI.BANK_SETUP;
    case ERROR_CODES.CONFIGURATION_ERROR:
      return PORTAL.CONFIG_ERROR;
    case ERROR_CODES.SUBSCRIPTION_REQUIRED:
      return PORTAL.ACCESS_ERROR;
    case ERROR_CODES.UNAUTHORIZED:
      return PORTAL.OWNER_ERROR;
    case ERROR_CODES.VALIDATION_FAILED:
      return PORTAL.VALIDATION_ERROR;
    case ERROR_CODES.CONFLICT:
      return PORTAL.CONFLICT_ERROR;
    default:
      return PORTAL.ERROR;
  }
}
