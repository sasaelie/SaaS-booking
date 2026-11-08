import { ERROR_CODES, PAYMENT_RULES, FILE_SIGNATURES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
export type AllowedProofMimeType = (typeof PAYMENT_RULES.ALLOWED_PROOF_MIME_TYPES)[number];
export interface ValidatedProofFile {
  readonly detectedMimeType: AllowedProofMimeType;
  readonly byteLength: number;
  readonly safeExtension: 'jpg' | 'png' | 'webp';
}
function matches(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}
export function validateBankProofBinary(bytes: Uint8Array): Result<ValidatedProofFile> {
  if (!bytes.length || bytes.length > PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES)
    return failure(ERROR_CODES.INVALID_PROOF_FILE, 'ProofValidator', 'header');
  if (matches(bytes, FILE_SIGNATURES.JPEG))
    return ok({ detectedMimeType: 'image/jpeg', byteLength: bytes.length, safeExtension: 'jpg' });
  if (matches(bytes, FILE_SIGNATURES.PNG))
    return ok({ detectedMimeType: 'image/png', byteLength: bytes.length, safeExtension: 'png' });
  if (
    bytes.length >= FILE_SIGNATURES.WEBP_MIN &&
    matches(bytes, FILE_SIGNATURES.WEBP_PREFIX) &&
    matches(bytes, FILE_SIGNATURES.WEBP_SUFFIX, FILE_SIGNATURES.WEBP_OFFSET)
  )
    return ok({ detectedMimeType: 'image/webp', byteLength: bytes.length, safeExtension: 'webp' });
  return failure(ERROR_CODES.INVALID_PROOF_FILE, 'ProofValidator', 'header');
}
