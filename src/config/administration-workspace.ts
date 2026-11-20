export const ADMIN_WORKSPACE = {
  PAGE_SIZES: [25, 50] as const,
  PAGE_MAX: 1000000,
  FINANCE: 'Finances',
  USAGE: 'Utilisation',
  DETAILS: 'Détails et accès',
  MORE: 'Plus de filtres',
  STATUS: 'Statut',
  PLAN: 'Formule',
  SORT: 'Trier par',
  SIZE: 'Résultats par page',
  ALL: 'Tous',
  TYPE: 'Type de traitement',
  RESET: 'Réinitialiser',
  RESULTS: 'résultat(s)',
  PAGE: 'Page',
  OF: 'sur',
  ORGANIZATIONS: 'Organisations',
  ORGANIZATION_HINT:
    'Recherchez un nom, un lien ou une adresse e-mail. Ouvrez une ligne pour consulter les détails.',
  ORGANIZATION_SORTS: [
    ['name', 'Nom A → Z'],
    ['newest', 'Inscriptions récentes'],
    ['oldest', 'Inscriptions anciennes'],
    ['expiry', 'Échéances proches'],
  ] as const,
  OPERATION_SORTS: [
    ['priority', 'À traiter en priorité'],
    ['oldest', 'Plus anciennes'],
    ['newest', 'Plus récentes'],
  ] as const,
  HISTORY_SORTS: [
    ['newest', 'Plus récentes'],
    ['oldest', 'Plus anciennes'],
  ] as const,
  ACCESS_FILTERS: [
    ['', 'Tous les accès'],
    ['ACTIVE', 'Abonnement actif'],
    ['COMPLIMENTARY', 'Accès offert'],
    ['PAST_DUE', 'Paiement à régulariser'],
    ['SUSPENDED', 'Suspendu'],
    ['EXPIRED', 'Expiré'],
    ['INACTIVE', 'À activer'],
  ] as const,
  OPERATION_FILTERS: [
    ['', 'Tous les traitements'],
    ['PENDING', 'En attente'],
    ['RETRY', 'À réessayer'],
  ] as const,
  PLAN_FILTERS: [
    ['', 'Toutes les formules'],
    ['LIBERTE', 'Liberté'],
    ['PRO', 'Studio Pro'],
  ] as const,
  NO_DETAILS: 'Aucun détail supplémentaire.',
} as const;
export type AdministrationSearchParams = Partial<
  Record<'page' | 'search' | 'pageSize' | 'status' | 'sort' | 'plan' | 'type', string>
>;
