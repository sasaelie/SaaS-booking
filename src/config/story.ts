export const STORY_TONES = ['WHITE', 'BLACK', 'FOREST'] as const;
export type StoryTextTone = (typeof STORY_TONES)[number];
export const STORY_UI = {
  TITLE: 'Texte de l’encart de présentation',
  HINT: 'Ce choix concerne les textes de l’encart de réservation et des cartes d’activités.',
  WHITE: 'Blanc',
  BLACK: 'Noir',
  FOREST: 'Vert sapin',
  DEFAULT: 'WHITE',
  PHOTO: 'Photo de l’encart de présentation',
  PHOTO_HINT:
    'Cette image remplit l’encart de présentation et les cartes d’activités, jamais le fond de la page. Elle est centrée et recadrée automatiquement selon l’écran.',
  SAMPLE: 'Votre activité',
  PRICE: 'Tarif de la séance',
} as const;
