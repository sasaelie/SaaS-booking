export const MARKETING_DEMO = {
  FADE_OUT_MS: 1000,
  FADE_IN_MS: 1000,
  STEPS: [
    {
      key: 'draft',
      actor: 'Organisateur',
      label: 'Création de l’activité',
      status: 'Préparation de l’activité',
      delayMs: 4100,
    },
    {
      key: 'published',
      actor: 'Organisateur',
      label: 'Activité publiée',
      status: 'Séances ouvertes aux réservations',
      delayMs: 3500,
    },
    {
      key: 'selected',
      actor: 'Client',
      label: 'Choix d’une séance',
      status: 'Le client choisit sa séance',
      delayMs: 3500,
    },
    {
      key: 'booked',
      actor: 'Organisateur',
      label: 'Réservation reçue',
      status: 'Réservation simulée · 1 place',
      delayMs: 4900,
    },
  ],
  TITLE: 'Activité',
  SESSION: 'Séance',
  CAPACITY: 'Places proposées',
  PRICE: 'Tarif',
  PUBLISHING: 'Publication en cours…',
  PLACE: 'place disponible',
  PLACES: 'places disponibles',
} as const;
export type DemoPhase = (typeof MARKETING_DEMO.STEPS)[number]['key'];
