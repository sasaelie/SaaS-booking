export const RECORDED_PAYMENT = {
  METHODS: ['CASH', 'CARD_TERMINAL', 'OTHER'] as const,
  TITLE: 'Règlement sur place',
  METHOD: 'Moyen reçu',
  LABELS: { CASH: 'Espèces', CARD_TERMINAL: 'Terminal bancaire', OTHER: 'Autre règlement' },
  REFERENCE: 'Référence de votre reçu',
  CONFIRM: 'Je confirme avoir reçu ce règlement.',
  RECORD: 'Enregistrer le règlement reçu',
  BANK_REFERENCE: 'Référence du virement reçu (relevé bancaire)',
} as const;
