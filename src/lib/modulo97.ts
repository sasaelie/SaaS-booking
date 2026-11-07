import { BANK_REFERENCE, ERROR_CODES } from '../config/constants';
import { failure } from './errors';
import { ok, type Result } from './result';
export function generateStructuredCommunication(sequenceNumber: number): Result<string> {
  if (
    !Number.isSafeInteger(sequenceNumber) ||
    sequenceNumber <= 0 ||
    sequenceNumber > BANK_REFERENCE.MAX_SEQUENCE
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Modulo97', 'generateStructuredCommunication');
  const base = String(sequenceNumber).padStart(BANK_REFERENCE.BASE_LENGTH, '0');
  const check = sequenceNumber % BANK_REFERENCE.MODULUS || BANK_REFERENCE.MODULUS;
  const full = `${base}${String(check).padStart(BANK_REFERENCE.CHECK_LENGTH, '0')}`;
  return ok(
    `${BANK_REFERENCE.PREFIX}${full.slice(0, BANK_REFERENCE.PART_ONE_END)}/${full.slice(BANK_REFERENCE.PART_ONE_END, BANK_REFERENCE.PART_TWO_END)}/${full.slice(BANK_REFERENCE.PART_TWO_END)}${BANK_REFERENCE.PREFIX}`,
  );
}
