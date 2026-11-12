export const SIMULATION = {
  DELETED_IDENTITY: {
    firstName: 'TEST',
    lastName: 'Supprimé',
    email: 'deleted@example.invalid',
    phone: null,
    marketingOptIn: false,
    proofStorageKey: null,
  },
  TAG: 'TEST',
  RETURN_APPEARANCE: 'Retour aux réglages d’apparence',
  RETURN_ACTIVITIES: 'Retour aux activités de test',
  PAYMENT_NOTICE: 'Aucune carte bancaire ni aucun virement ne sont demandés.',
  DELETE_FAILED: 'Suppression impossible. Réessayez.',
  MANAGE: 'Gérer cette réservation TEST',
  DETAILS: 'Détails et conditions acceptées',
  VOUCHER: 'Code de report TEST :',
  REUSE: 'Réutiliser dans une réservation TEST',
  UNTIL: 'jusqu’au',
  PAID_SUFFIX: 'simulés',
  SCHEMA_SUFFIX: '_simulation',
  TITLE: 'Simulation participant — TEST',
  NOTE: 'Réservations de test conservées dans un espace isolé. Aucun débit, aucun e-mail envoyé, aucune place réelle occupée. Supprimez vos tests lorsque vous avez terminé.',
  OPEN: 'Tester le parcours participant',
  LIST: 'Mes réservations de test',
  SUCCESS: 'Test réussi',
  INCOMPLETE: 'Test incomplet',
  FAILED: 'Paiement simulé refusé — vous pouvez réessayer.',
  PAY: 'Simuler un paiement réussi',
  FAIL: 'Simuler un paiement refusé',
  DELETE: 'Supprimer ce test',
  EMPTY: 'Aucune réservation de test. Parcourez votre catalogue pour en créer une.',
  RETURN: 'Retour aux tests de mon espace',
  PAYMENT: 'Paiement de test',
  TERMS_EDIT: 'Modifier les consignes et les règles de report',
  SECRET_CONTEXT: 'participant-simulation-v1',
  FAKE_ACCOUNT: 'acct_simulation',
  REFERENCE_PREFIX: 'simulation_',
  TABLES: [
    'organizations',
    'organization_access',
    'organization_branding',
    'activities',
    'time_slots',
    'pause_periods',
    'sessions',
  ],
} as const;
export function simulationPath(id: string) {
  return `/simulation/${id}`;
}
export function simulationApi(id: string, operation: string) {
  return `/api/simulation/${id}/${operation}`;
}
