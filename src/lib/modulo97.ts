// src/lib/modulo97.ts
import { ERROR_CODES } from '../config/constants';
import { failAndLog } from './logger';
import { ok, type AppError, type Result } from './result';

export function generateStructuredCommunication(
  sequenceNumber: number,
): Result<string, AppError> {
  if (
    !Number.isInteger(sequenceNumber) ||
    sequenceNumber <= 0 ||
    sequenceNumber > 9_999_999_999
  ) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'Modulo97',
      fn: 'generateStructuredCommunication',
      cause: 'Numéro de séquence hors limites (10 chiffres max)',
      received: String(sequenceNumber),
      expected: 'entier entre 1 et 9999999999',
    });
  }
  const baseTenDigits = String(sequenceNumber).padStart(10, '0');
  const remainder = sequenceNumber % 97;
  const checkDigits = String(remainder === 0 ? 97 : remainder).padStart(2, '0');
  const fullTwelve = `${baseTenDigits}${checkDigits}`;
  const part1 = fullTwelve.slice(0, 3);
  const part2 = fullTwelve.slice(3, 7);
  const part3 = fullTwelve.slice(7, 12);
  return ok(`+++${part1}/${part2}/${part3}+++`);
}
