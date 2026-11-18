export const PLATFORM_REPORTING = {
  CHART_PERCENT: 100,
  CHART_DAYS_MAX: 40,
  MONTH_LABEL_LENGTH: 7,
  ISO_DATE_LENGTH: 10,
  PREPARE_INVOICE: 'Préparer une facture',
  PREPARE_CREDIT: 'Préparer un avoir',
  STRIPE_INVOICE: 'Facture Stripe originale',
  DEFAULT_DAYS: 30,
  MAX_DAYS: 366,
  EXPORT_MAX: 10000,
  TIMEZONE: 'Europe/Brussels',
  MIDNIGHT: '00:00',
  FROM: 'Du',
  TO: 'Au',
  APPLY: 'Afficher',
  JOURNAL: 'Journal',
  RECONCILIATION: 'Rapprochements',
  DOCUMENTS: 'Factures et avoirs',
  COSTS: 'Ajustements',
  SETTINGS: 'Facturation',
  FINANCE_HINT:
    'Vos revenus de plateforme, leurs justificatifs et les mouvements des organisateurs, distingués dans un même espace.',
  USAGE_HINT:
    'Comprenez l’adoption de votre outil à partir des comptes, activités et réservations enregistrés.',
  USAGE_NOTE:
    'Statistiques globales. Les simulations sont exclues. Ces chiffres ne mesurent pas les visiteurs anonymes ni les installations sur téléphone.',
  PERIOD_NOTE:
    'Dates en heure de Bruxelles. Les remboursements figurent à leur date d’enregistrement.',
  PLATFORM: 'Plateforme',
  ORGANIZER: 'Organisateurs',
  CREDIT: 'Reports sans encaissement',
  SCOPE: 'Périmètre',
  KIND: 'Mouvement',
  ALL: 'Tous',
  CSV: 'Exporter en CSV',
  XLSX: 'Exporter en Excel',
  EXPORT_ERROR: 'Export indisponible. Réduisez la période ou précisez une organisation.',
  EXPORT_NOTE:
    'Export de gestion avec les montants et références enregistrés. Les reports ne sont pas des recettes. Le plan comptable reste à définir avec votre comptable.',
  EMPTY: 'Aucun mouvement sur cette période.',
  REFERENCE: 'Référence',
  AMOUNT: 'Montant',
  DATE: 'Date',
  DETAILS: 'Voir les détails',
  INCOME: 'Abonnements nets de remboursements',
  COMMISSIONS: 'Commissions nettes de remboursements',
  FEES: 'Frais de paiement enregistrés',
  OTHER_COSTS: 'Autres coûts',
  BALANCE: 'Solde plateforme avant charges et impôts',
  BOOKING_VOLUME: 'Encaissements organisateurs, hors revenus plateforme',
  RECONCILED: 'Rapproché',
  PENDING: 'À rapprocher',
  HISTORICAL: 'Historique',
  GROSS: 'Montant payé',
  COMMISSION: 'Commission',
  BANK_FEE: 'Frais réels',
  NET_ORGANIZER: 'Net organisateur',
  UNKNOWN: 'Non renseigné',
  ORGANIZERS: 'Comptes organisateurs',
  NEW_ORGANIZATIONS: 'Nouvelles organisations',
  ACTIVE_ORGANIZATIONS: 'Organisations avec une réservation',
  CONFIRMED: 'Réservations confirmées',
  CANCELLED: 'Réservations annulées',
  DISTINCT_PARTICIPANTS: 'Adresses participant distinctes',
  ACTIVITIES: 'Activités créées',
  PUBLISHED: 'Activités actuellement publiées',
  DAILY: 'Réservations confirmées au fil des jours',
  COHORT: 'Premiers pas des nouvelles organisations',
  REGISTERED: 'Organisation créée',
  FIRST_ACTIVITY: 'Première activité',
  FIRST_PUBLICATION: 'Activité publiée',
  FIRST_BOOKING: 'Première réservation',
  COHORT_NOTE:
    'Organisations créées pendant la période choisie : activité créée, puis réservation confirmée avant sa fin, même si elle a été annulée ensuite.',
  BREAKDOWN: 'Répartition des organisations',
  TABLE: 'Voir les chiffres jour par jour',
  ZERO_ACTIVITY: 'Aucune réservation confirmée sur cette période.',
  KINDS: {
    SUBSCRIPTION: 'Abonnement',
    PAYMENT: 'Paiement participant',
    REFUND: 'Remboursement participant',
    COMMISSION: 'Commission plateforme',
    COMMISSION_REFUND: 'Remboursement de commission',
    PROCESSING_FEE: 'Frais de paiement',
    COST: 'Coût exceptionnel',
    VOUCHER_ISSUED: 'Report émis',
    VOUCHER_USED: 'Report utilisé',
    ADJUSTMENT: 'Ajustement',
  } as Readonly<Record<string, string>>,
} as const;
export type PlatformReportSearch = Partial<
  Record<
    | 'from'
    | 'to'
    | 'page'
    | 'pageSize'
    | 'search'
    | 'scope'
    | 'kind'
    | 'view'
    | 'status'
    | 'organizationId'
    | 'source'
    | 'documentKind',
    string
  >
>;
