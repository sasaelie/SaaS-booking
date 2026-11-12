export const CONTACT = {
  PHONE: 'Numéro de téléphone de contact',
  HINT: 'Facultatif. Numéro belge (ex. 0470 12 34 56) ou international avec +. Il sera visible sur votre page participant.',
  INVALID: 'Indiquez un numéro belge complet ou un numéro international avec son indicatif.',
  CALL: 'Téléphone',
  INPUT_PATTERN: String.raw`[+\d\s.\(\)\-]+`,
  INPUT_MAX: 40,
  BELGIAN_PREFIX: '+32',
  INTERNATIONAL_PATTERN: /^\+[1-9]\d{7,14}$/,
  BELGIAN_PATTERN: /^\+32[1-9]\d{7,8}$/,
} as const;
