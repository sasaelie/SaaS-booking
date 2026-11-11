export const SESSION_EXIT = {
  EVENT: 'booking:request-session-exit',
  SOURCE_KEY: 'booking:exit-from-spaces',
  TITLE: 'Quitter Mes espaces ?',
  MESSAGE: 'Vous allez être déconnecté pour revenir à l’accueil. Voulez-vous continuer ?',
  CANCEL: 'Rester connecté',
  CONFIRM: 'Me déconnecter',
  PENDING: 'Déconnexion…',
} as const;
