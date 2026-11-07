// src/core/domain/booking-validation.ts
import { z } from 'zod';
import {
  AUDIENCE_POLICIES,
  ERROR_CODES,
  type AudiencePolicy,
} from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
const PHONE_REGEX = /^\+?[0-9\s\-().]{8,20}$/;
export const CreateBookingInputSchema = z.object({
  organizationId: z.string().min(1),
  activityId: z.string().min(1),
  startsAtIso: z.string().datetime(),
  idempotencyKey: z.string().min(8).max(128),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().optional().nullable(),
  marketingOptIn: z.boolean().default(false),
  acceptedTerms: z.boolean(),
  acceptedAgeAttestation: z.boolean(),
  acceptedTermsVersionHash: z.string().min(1),
  voucherCode: z.string().trim().toUpperCase().optional().nullable(),
});
export type RawCreateBookingInput = z.input<typeof CreateBookingInputSchema>;
export type ValidatedCreateBookingInput = z.output<
  typeof CreateBookingInputSchema
>;
export interface ActivityPolicyContext {
  readonly audiencePolicy: AudiencePolicy;
  readonly requirePhone: boolean;
  readonly expectedTermsVersionHash: string;
}
export function validateBookingInputWithPolicy(
  rawInput: unknown,
  policy: ActivityPolicyContext,
): Result<ValidatedCreateBookingInput, AppError> {
  const parsed = CreateBookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'BookingValidation',
      fn: 'validateBookingInputWithPolicy',
      cause: `Champ invalide: ${firstIssue?.path.join('.') ?? 'inconnu'}`,
      received: JSON.stringify(rawInput),
      expected: firstIssue?.message ?? 'Schéma CreateBookingInputSchema valide',
    });
  }
  const data = parsed.data;
  if (!data.acceptedTerms || !data.acceptedAgeAttestation) {
    return failAndLog({
      code: ERROR_CODES.TERMS_NOT_ACCEPTED,
      module: 'BookingValidation',
      fn: 'validateBookingInputWithPolicy',
      cause:
        'Cases obligatoires (CGV ou attestation majorité/représentant légal) non cochées',
      received: `terms=${String(data.acceptedTerms)}, age=${String(data.acceptedAgeAttestation)}`,
      expected: 'acceptedTerms=true et acceptedAgeAttestation=true',
    });
  }
  if (data.acceptedTermsVersionHash !== policy.expectedTermsVersionHash) {
    return failAndLog({
      code: ERROR_CODES.TERMS_NOT_ACCEPTED,
      module: 'BookingValidation',
      fn: 'validateBookingInputWithPolicy',
      cause: 'Empreinte de version des CGV obsolète ou altérée',
      received: data.acceptedTermsVersionHash,
      expected: policy.expectedTermsVersionHash,
    });
  }
  const phoneRequired =
    policy.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY ||
    policy.requirePhone;
  const cleanPhone = data.phone?.trim() ?? '';
  if (phoneRequired && (!cleanPhone || !PHONE_REGEX.test(cleanPhone))) {
    return failAndLog({
      code: ERROR_CODES.MINOR_EMERGENCY_PHONE_REQUIRED,
      module: 'BookingValidation',
      fn: 'validateBookingInputWithPolicy',
      cause:
        'Numéro de téléphone d’urgence obligatoire pour cette activité (Mineurs)',
      received: cleanPhone || 'vide',
      expected: 'numéro de téléphone valide (8 à 20 caractères)',
    });
  }
  if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'BookingValidation',
      fn: 'validateBookingInputWithPolicy',
      cause: 'Format de numéro de téléphone invalide',
      received: cleanPhone,
      expected: 'numéro de téléphone valide (8 à 20 caractères)',
    });
  }
  return ok({ ...data, phone: cleanPhone ? cleanPhone : null });
}
