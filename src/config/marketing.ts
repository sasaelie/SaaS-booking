import { PLATFORM_BRAND } from './platform-brand';
export const MARKETING = {
  BRAND: PLATFORM_BRAND.NAME,
  CATEGORY: 'Réservations en ligne',
  TITLE: 'Réservations en ligne pour ateliers et associations',
  DESCRIPTION:
    'Un logiciel de réservation en ligne pour ateliers, clubs et associations : calendrier, inscriptions, paiements Bancontact et carte, reports et comptabilité.',
  EYEBROW: 'Pour les ateliers, indépendants, clubs et associations',
  HERO_FIRST: 'Vos réservations en ligne.',
  HERO_SECOND: 'Du temps pour ce qui compte.',
  HERO_DESCRIPTION:
    'Publiez vos activités, partagez votre lien et retrouvez vos réservations au même endroit. Vos participants choisissent leur séance, sans créer de compte.',
  NAV_LABEL: 'Navigation principale',
  ACCOUNT_LABEL: 'Accès au compte',
  NAV: [
    { href: '/#fonctionnement', label: 'Comment ça marche' },
    { href: '/#tarifs', label: 'Tarifs' },
    { href: '/#questions', label: 'Questions' },
  ],
  SIGNUP: 'Créer mon espace',
  LOGIN: 'Connexion',
  SPACES: 'Mes espaces',
  DISCOVER: 'Voir comment ça marche',
  SKIP: 'Aller au contenu',
  REASSURANCE: [
    'Sans carte à l’inscription',
    'Sans compte participant',
    'Un prix public tout compris',
  ],
  WORKFLOW_EYEBROW: 'Un lien suffit pour commencer',
  WORKFLOW_TITLE: 'Vous créez. Vous partagez. Ils réservent.',
  STEPS: [
    {
      number: '01',
      title: 'Préparez vos activités',
      text: 'Définissez un prix, vos horaires et le nombre de places. Séances ponctuelles ou calendrier hebdomadaire : vous choisissez.',
    },
    {
      number: '02',
      title: 'Partagez votre page',
      text: 'Votre lien se partage en bio Instagram, sur WhatsApp ou par e-mail. Vos couleurs, votre photo et vos coordonnées présentent votre activité.',
    },
    {
      number: '03',
      title: 'Suivez les inscriptions',
      text: 'Vos participants réservent une place. Retrouvez ensuite les inscrits, les paiements et les demandes à traiter dans votre espace.',
    },
  ],
  BENEFITS_EYEBROW: 'Moins de gestion, plus de visibilité',
  BENEFITS_TITLE: 'Les bons outils, au même endroit.',
  BENEFITS: [
    {
      icon: 'calendar',
      title: 'Des places à jour',
      text: 'Les réservations confirmées et les paiements en cours mettent à jour les disponibilités. Un créneau complet ne prend plus de nouvelles inscriptions.',
    },
    {
      icon: 'ticket',
      title: 'Vos règles, clairement',
      text: 'Précisez vos consignes et délais d’annulation. Un participant éligible reçoit un code de report, utilisable uniquement dans votre organisation.',
    },
    {
      icon: 'lock',
      title: 'Les paiements à leur place',
      text: 'Carte et Bancontact en Liberté. Avec Pro, ajoutez les virements à communication structurée belge et retrouvez vos écritures dans un export Excel.',
    },
  ],
  PRICING_EYEBROW: 'Une formule par espace',
  PRICING_TITLE: 'Commencez librement. Évoluez à votre rythme.',
  PRICING_DESCRIPTION:
    'Deux offres, un prix affiché respecté pour vos participants. Le choix d’une formule ne déclenche aucun prélèvement.',
  PRICING_NOTE:
    'Liberté : les frais sont déduits de votre prix. Studio Pro : seuls les frais bancaires Stripe réels restent dus pour les paiements en ligne.',
  YEAR_SAVING: 'de moins par an qu’avec douze mensualités.',
  BILLING_NOTE:
    'Tarifs par espace organisateur. Les modalités de facturation et le régime de TVA sont précisés avant tout paiement.',
  FAQ_EYEBROW: 'Avant de vous lancer',
  FAQ_TITLE: 'Des réponses, simplement.',
  CONTACT: 'Nous contacter',
  FINAL_TITLE: 'Votre prochaine activité mérite mieux qu’un fil de messages.',
  FINAL_DESCRIPTION:
    'Créez votre espace, préparez votre calendrier et partagez votre premier lien.',
  FINAL_CONNECTED: 'Votre calendrier vous attend.',
  FINAL_CONNECTED_DESCRIPTION:
    'Retrouvez vos activités et les prochaines inscriptions dans votre espace.',
  FINAL_ACTION: 'Commencer avec Liberté',
  FINAL_CONNECTED_ACTION: 'Retrouver mes activités',
  FOOTER_DESCRIPTION:
    'Votre page de réservation, votre calendrier et vos participants, réunis simplement.',
  FOOTER_LABEL: 'Informations et contact',
  FOOTER_PRODUCT: 'Découvrir',
  FOOTER_LEGAL: 'Informations',
  FOOTER_RIGHTS: 'Tous droits réservés.',
  FOOTER_LINKS: [
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/confidentialite', label: 'Confidentialité' },
    { href: '/conditions', label: 'Conditions d’utilisation' },
    { href: '/accessibilite', label: 'Accessibilité' },
    { href: '/contact', label: 'Contact' },
  ],
} as const;
