import { z } from 'zod';
import { AUDIENCE_POLICIES, ERROR_CODES, INPUT_LIMITS } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import type { AudiencePolicy } from '../../config/constants';
const phone = z
  .string()
  .trim()
  .max(INPUT_LIMITS.KEY_MAX)
  .nullish()
  .transform((value) => value?.trim() || null);
export const CreateBookingInputSchema = z.object({
  organizationId: z.uuid(),
  activityId: z.uuid(),
  startsAtIso: z.iso.datetime(),
  idempotencyKey: z.string().min(INPUT_LIMITS.KEY_MIN).max(INPUT_LIMITS.KEY_MAX),
  firstName: z.string().trim().min(INPUT_LIMITS.NAME_MIN).max(INPUT_LIMITS.NAME_MAX),
  lastName: z.string().trim().min(INPUT_LIMITS.NAME_MIN).max(INPUT_LIMITS.NAME_MAX),
  email: z.email().max(INPUT_LIMITS.EMAIL_MAX),
  phone,
  marketingOptIn: z.boolean().default(false),
  acceptedTerms: z.boolean(),
  acceptedAgeAttestation: z.boolean(),
  acceptedTermsVersionHash: z.string().length(INPUT_LIMITS.HASH_LENGTH),
  voucherCode: z
    .string()
    .trim()
    .max(INPUT_LIMITS.KEY_MAX)
    .toUpperCase()
    .nullish()
    .transform((value) => value || null),
});
export type RawCreateBookingInput = z.input<typeof CreateBookingInputSchema>;
export type ValidatedCreateBookingInput = z.output<typeof CreateBookingInputSchema>;
export interface ActivityPolicyContext {
  readonly audiencePolicy: AudiencePolicy;
  readonly requirePhone: boolean;
  readonly expectedTermsVersionHash: string;
}
export function parseBookingInput(raw: unknown): Result<ValidatedCreateBookingInput> {
  const parsed = CreateBookingInputSchema.safeParse(raw);
  return parsed.success
    ? ok(parsed.data)
    : failure(ERROR_CODES.VALIDATION_FAILED, 'BookingValidation', 'parseBookingInput');
}
function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return (
    /^\+?[\d\s().-]+$/.test(value) &&
    digits.length >= INPUT_LIMITS.PHONE_MIN_DIGITS &&
    digits.length <= INPUT_LIMITS.PHONE_MAX_DIGITS
  );
}
export function validateBookingInputWithPolicy(
  raw: unknown,
  policy: ActivityPolicyContext,
): Result<ValidatedCreateBookingInput> {
  const parsed = parseBookingInput(raw);
  if (!parsed.ok) return parsed;
  const data = parsed.value;
  if (
    !data.acceptedTerms ||
    !data.acceptedAgeAttestation ||
    data.acceptedTermsVersionHash !== policy.expectedTermsVersionHash
  )
    return failure(
      ERROR_CODES.TERMS_NOT_ACCEPTED,
      'BookingValidation',
      'validateBookingInputWithPolicy',
    );
  const required = policy.requirePhone || policy.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY;
  if (required && (!data.phone || !validPhone(data.phone)))
    return failure(
      ERROR_CODES.MINOR_EMERGENCY_PHONE_REQUIRED,
      'BookingValidation',
      'validateBookingInputWithPolicy',
    );
  if (data.phone && !validPhone(data.phone))
    return failure(
      ERROR_CODES.VALIDATION_FAILED,
      'BookingValidation',
      'validateBookingInputWithPolicy',
    );
  return ok(data);
}
