export const MARKETING_VISUALS = {
  IMAGE_SIZES: '(max-width: 760px) 380px, 440px',
  STORY_EYEBROW: 'Votre activité prend vie',
  STORY_TITLE: 'Un lien à partager. Un planning à vous.',
  STORY_INTRO:
    'Une page pour vos participants, des outils pour vous. Explorez ce qui se passe derrière une réservation.',
  CALENDAR_LABEL: 'Exemple de planning · données fictives',
  CALENDAR_REGION: 'Planning de la démonstration',
  CALENDAR_TITLE: 'Vos prochaines séances',
  CALENDAR_DAYS: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  CALENDAR_DATES: ['16', '17', '18', '19', '20', '21', '22'],
  CARD_HINT: 'Touchez une carte ou explorez-la au clavier pour en savoir plus.',
  FEATURE_LABEL: 'Explorer les outils de réservation',
  FEATURES: [
    {
      id: 'calendar',
      icon: 'calendar',
      title: 'Vos séances régulières',
      lead: 'Vos horaires, organisés à votre rythme.',
      badge: 'Toutes les formules',
      detail:
        'Créez vos horaires hebdomadaires ou des séances ponctuelles et définissez les places disponibles. Chaque participant choisit sa séance et réserve une place.',
      steps: ['Vos horaires', 'Vos séances'],
    },
    {
      id: 'voucher',
      icon: 'ticket',
      title: 'Les codes de report',
      lead: 'Des imprévus gérés selon vos règles.',
      badge: 'Toutes les formules',
      detail:
        'Le participant utilise son lien personnel pour annuler. Si les conditions de report sont respectées, il reçoit un code utilisable uniquement dans votre organisation.',
      steps: ['Annulation éligible', 'Code de report'],
    },
    {
      id: 'bank',
      icon: 'lock',
      title: 'Les virements structurés',
      lead: 'Une référence belge pour s’y retrouver.',
      badge: 'Studio Pro',
      detail:
        'Proposez le virement avec communication structurée belge. Retrouvez les justificatifs et vérifiez les paiements reçus avant de les valider dans votre espace.',
      steps: ['Référence structurée', 'Votre validation'],
    },
    {
      id: 'share',
      icon: 'arrow',
      title: 'Votre page à partager',
      lead: 'Votre image, jusque dans la réservation.',
      badge: 'Toutes les formules',
      detail:
        'Présentez vos activités avec vos couleurs et vos photos. Partagez votre lien sur votre site ou vos réseaux : vos participants réservent sans créer de compte.',
      steps: ['Votre page', 'Un lien à partager'],
    },
  ],
} as const;
export type MarketingVisualFeature = (typeof MARKETING_VISUALS.FEATURES)[number];
