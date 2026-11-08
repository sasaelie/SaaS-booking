import { SAAS } from '../../config/constants';
export function isValidIban(value: string): boolean {
  if (
    value.length < SAAS.IBAN_MIN_LENGTH ||
    value.length > SAAS.IBAN_MAX_LENGTH ||
    !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(value)
  )
    return false;
  const rotated = value.slice(SAAS.IBAN_ROTATION) + value.slice(0, SAAS.IBAN_ROTATION);
  let remainder = 0;
  for (const character of rotated) {
    const digits = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - SAAS.IBAN_LETTER_OFFSET)
      : character;
    for (const digit of digits)
      remainder = (remainder * SAAS.DECIMAL_BASE + Number(digit)) % SAAS.IBAN_MODULUS;
  }
  return remainder === 1;
}
