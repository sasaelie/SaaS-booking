// src/core/domain/proof-validator.ts
import { ERROR_CODES, PAYMENT_RULES } from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
export type AllowedProofMimeType =
  (typeof PAYMENT_RULES.ALLOWED_PROOF_MIME_TYPES)[number];
export interface ValidatedProofFile {
  readonly detectedMimeType: AllowedProofMimeType;
  readonly byteLength: number;
  readonly safeExtension: 'jpg' | 'png' | 'webp';
}
function isJpegMagicBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}
function isPngMagicBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}
function isWebpMagicBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
export function validateBankProofBinary(
  fileBytes: Uint8Array,
): Result<ValidatedProofFile, AppError> {
  if (fileBytes.byteLength === 0) {
    return failAndLog({
      code: ERROR_CODES.INVALID_PROOF_FILE,
      module: 'ProofValidator',
      fn: 'validateBankProofBinary',
      cause: 'Fichier de preuve de virement vide (0 octet)',
      received: '0 bytes',
      expected: 'image JPEG, PNG ou WebP entre 1 octet et 5 Mo',
    });
  }
  if (fileBytes.byteLength > PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES) {
    return failAndLog({
      code: ERROR_CODES.INVALID_PROOF_FILE,
      module: 'ProofValidator',
      fn: 'validateBankProofBinary',
      cause: 'Fichier de preuve dépassant la limite autorisée de 5 Mo',
      received: `${fileBytes.byteLength} bytes`,
      expected: `<= ${PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES} bytes`,
    });
  }
  if (isPngMagicBytes(fileBytes))
    return ok({
      detectedMimeType: 'image/png',
      byteLength: fileBytes.byteLength,
      safeExtension: 'png',
    });
  if (isJpegMagicBytes(fileBytes))
    return ok({
      detectedMimeType: 'image/jpeg',
      byteLength: fileBytes.byteLength,
      safeExtension: 'jpg',
    });
  if (isWebpMagicBytes(fileBytes))
    return ok({
      detectedMimeType: 'image/webp',
      byteLength: fileBytes.byteLength,
      safeExtension: 'webp',
    });
  return failAndLog({
    code: ERROR_CODES.INVALID_PROOF_FILE,
    module: 'ProofValidator',
    fn: 'validateBankProofBinary',
    cause:
      'Signature binaire (Magic Bytes) non reconnue : seuls PNG, JPEG et WebP sont acceptés',
    received: Array.from(fileBytes.slice(0, 4))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
    expected: 'FFD8FF (JPEG), 89504E47 (PNG) ou RIFF....WEBP (WebP)',
  });
}
