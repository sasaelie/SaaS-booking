export const MARKETING_DEMO = {
  FADE_OUT_MS: 120,
  FADE_IN_MS: 180,
  STEPS: [
    {
      key: 'draft',
      actor: 'Organisateur',
      label: 'Création de l’activité',
      status: 'Préparation de l’activité',
      delayMs: 2400,
    },
    {
      key: 'published',
      actor: 'Organisateur',
      label: 'Activité publiée',
      status: 'Séances ouvertes aux réservations',
      delayMs: 1800,
    },
    {
      key: 'selected',
      actor: 'Client',
      label: 'Choix d’une séance',
      status: 'Le client choisit sa séance',
      delayMs: 1800,
    },
    {
      key: 'booked',
      actor: 'Organisateur',
      label: 'Réservation reçue',
      status: 'Réservation simulée · 1 place',
      delayMs: 3200,
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
