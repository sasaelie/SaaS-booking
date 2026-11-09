export const STORY_TONES = ['WHITE', 'BLACK', 'FOREST'] as const;
export type StoryTextTone = (typeof STORY_TONES)[number];
export const STORY_UI = {
  TITLE: 'Texte de l’encart de présentation',
  HINT: 'Ce choix concerne uniquement le titre, les descriptions et le tarif de l’encart.',
  WHITE: 'Blanc',
  BLACK: 'Noir',
  FOREST: 'Vert sapin',
  DEFAULT: 'WHITE',
  PHOTO: 'Photo de l’encart de présentation',
  PHOTO_HINT:
    'Cette image remplit l’encart de présentation, jamais le fond de la page. Elle est centrée et recadrée automatiquement selon l’écran.',
  SAMPLE: 'Votre activité',
  PRICE: 'Tarif de la séance',
} as const;
