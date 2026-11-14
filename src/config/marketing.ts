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
    { href: '/faq', label: 'FAQ' },
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
  PRICING_EYEBROW: 'Une formule par espace',
  PRICING_TITLE: 'Commencez librement. Évoluez à votre rythme.',
  PRICING_DESCRIPTION:
    'Deux offres, un prix affiché respecté pour vos participants. Le choix d’une formule ne déclenche aucun prélèvement.',
  PRICING_NOTE:
    'Liberté : les frais sont déduits de votre prix. Studio Pro : seuls les frais bancaires Stripe réels restent dus pour les paiements en ligne.',
  YEAR_SAVING: 'de moins par an qu’avec douze mensualités.',
  BILLING_NOTE:
    'Tarifs par espace organisateur. Les modalités de facturation et le régime de TVA sont précisés avant tout paiement.',
  FAQ_PAGE_TITLE: 'Questions fréquentes',
  FAQ_PAGE_DESCRIPTION:
    'Les réponses à vos questions sur les réservations, les offres, les paiements et les reports.',
  CONTACT: 'Nous contacter',
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
