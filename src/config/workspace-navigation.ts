export const WORKSPACE_NAV = {
  PARTICIPANTS: 'Participants',
  SETTINGS: 'Réglages',
  IDENTITY: 'Identité et contacts',
  APPEARANCE: 'Apparence',
  PAYMENTS: 'Paiements des participants',
  PLAN: 'Formule de l’espace',
  PREVIEW: 'Aperçu et tests',
  TRACKING: 'Suivi',
  OPERATIONS: 'Opérations en attente',
  HISTORY: 'Historique',
} as const;
export function organizerSection(path: string, root: string) {
  if (['/parametres', '/reglages', '/abonnement'].some((suffix) => path.startsWith(root + suffix)))
    return '/reglages';
  if (path.startsWith(root + '/tests')) return '/partager';
  const suffix = path.slice(root.length).split('/')[1];
  return suffix ? `/${suffix}` : '';
}
