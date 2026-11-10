export const SERVICE = {
  ABOUT: 'À propos de cette activité',
  PRACTICAL_SUMMARY: 'Informations pratiques',
  SOCIAL_HINT: 'Lien complet commençant par https:// (facultatif).',
  SOCIAL_PATTERN: 'https://.*',
  REMAINDER_TERMS:
    '7. SOLDE DU CODE DE REPORT : Lorsqu’un code couvre une réservation moins chère que sa valeur, un nouveau code correspondant au solde est créé après confirmation de la réservation. Il conserve la date d’expiration du code utilisé. Le code initial est consommé et ne peut plus être utilisé.',
  MISSING_ADDRESS: 'Adresse à compléter avant le rappel',
  REMAINDER: 'Un nouveau code sera créé pour le solde :',
  GRANT_CODE: 'Accorder un code de report',
  EXPIRY: 'Expiration du code',
  CONFIRM_CODE: 'Je confirme l’attribution de cet avoir pour cette réservation.',
  CODES: 'Codes de report',
  ISO_DATE_LENGTH: 10,
  TEXT_MAX: 4000,
  URL_MAX: 1000,
  DEFAULT_MONTHS: 2,
  EXPIRY_WARNING_DAYS: 7,
  DETAILS: 'Détails pratiques de l’événement',
  ADDRESS: 'Adresse ou lien de visioconférence',
  PUBLIC: 'Afficher l’adresse sur la page de réservation',
  DELAYED: 'Envoyer l’adresse par e-mail 24 heures avant',
  DELAYED_NOTICE:
    'L’adresse et les modalités pratiques vous seront envoyées par e-mail 24 heures avant votre séance.',
  PRACTICAL: 'Accès, matériel et consignes pratiques',
  TERMS: 'Consignes de participation et droit au remboursement',
  TERMS_HINT:
    'Vos consignes complètent les règles de report ci-dessous, qui restent appliquées automatiquement.',
  SOCIALS: 'Réseaux et contact',
  PAID: 'Payé',
  COVERED: 'Couvert par un code',
  FREE: 'Gratuit',
  DUE: 'Règlement attendu',
  PROOF: 'Justificatif à vérifier',
  EXPIRED: 'Délai de paiement expiré',
  CANCELLED: 'Annulée',
  SOON: 'Fin d’accès prochaine',
} as const;
export const SOCIAL_NETWORKS = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  website: 'Site internet',
} as const;

export const CODE_STATES: Readonly<Record<string, string>> = {
  ACTIVE: 'Disponible',
  LOCKED_PENDING_PAYMENT: 'Réservé en attente de paiement',
  USED_FOR_BOOKING: 'Utilisé',
  USED_FOR_EXTERNAL_BENEFIT: 'Utilisé',
  EXPIRED: 'Expiré',
};
export const PAYMENT_FILTERS = {
  PAYMENT_DUE: 'Règlements attendus',
  PAYMENT_RECEIVED: 'Paiements reçus',
  PAYMENT_COVERED: 'Couverts par un code',
  PAYMENT_EXPIRED: 'Délais de paiement dépassés',
} as const;
