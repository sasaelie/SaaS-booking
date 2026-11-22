export const SHARE_UI = {
  TEST_ACTIVATE: 'Activer mon partage TEST',
  TEST_ACTIVATE_TITLE: 'Tester vos réservations sur votre site',
  TEST_ACTIVATE_HINT:
    'Activez une copie publique de vos activités pour tester le parcours de vos participants. Les noms, tarifs, horaires et images seront visibles ; les réservations, comptes et coordonnées des participants restent dans leur espace d’origine.',
  TEST_ACKNOWLEDGE:
    'Je souhaite rendre mes activités accessibles pour ce TEST, sans paiement réel ni e-mail.',
  TITLE: 'Votre activité, partout.',
  INTRO: 'Choisissez où proposer vos réservations : sur votre site ou avec un lien à partager.',
  CHOOSE_MODE: 'Où souhaitez-vous proposer vos réservations ?',
  SOCIAL_MODE: 'Sur mes réseaux sociaux',
  WEBSITE_MODE: 'Sur mon site',
  SOCIAL_HINT:
    'Partagez ce lien sur Instagram, WhatsApp ou par e-mail. Il ouvre votre page de réservation, sans compte participant.',
  COPY_LINK: 'Copier le lien',
  COPY_INSTALL: 'Copier le code',
  OPEN_PAGE: 'Voir ma page de réservation',
  SOCIAL_STEPS: [
    'Copiez votre lien de réservation.',
    'Collez-le dans votre bio, une publication, un message ou un e-mail.',
  ],
  WEBSITE_STEPS: [
    'Choisissez un affichage ci-dessous.',
    'Copiez le code dans un bloc HTML de votre site.',
    'Enregistrez la page et vérifiez l’affichage de vos cours.',
  ],
  WEBSITE_BEHAVIOR:
    'Vos participants réservent et gèrent leur billet dans votre site. « Terminer » revient à votre page ou ferme la fenêtre flottante.',
  PLACEMENT: 'Affichage sur votre site',
  INLINE_CATALOG: 'Calendrier dans la page',
  FLOATING_CATALOG: 'Bouton « Réserver »',
  ACTIVITY_OPTIONS: 'Options par activité',
  MEMBERS: 'Et si mon site possède un espace membre ?',
  MEMBERS_STATUS: 'Raccordement non disponible actuellement',
  MEMBERS_NOTE:
    'Les réservations sont actuellement accessibles sans compte participant. Pour les réserver réellement aux membres de votre site, un raccordement sécurisé à votre espace membre sera nécessaire. Vos membres conserveront leur compte sur votre site.',
  MEMBERS_LINK_NOTE:
    'Afficher le lien seulement après connexion ne suffit pas à réserver l’accès aux membres : le lien peut être transmis.',
  DIRECT: 'Partager le lien',
  DIRECT_HINT: 'Pour votre site, les réseaux sociaux, les e-mails et WhatsApp.',
  COPY: 'Copier',
  COPIED: 'Copié',
  COPY_ERROR: 'La copie automatique est indisponible. Sélectionnez le texte pour le copier.',
  QR: 'Votre QR code',
  QR_HINT: 'Téléchargez une image haute définition pour vos affiches et flyers.',
  DOWNLOAD_QR: 'Télécharger le QR code',
  WEBSITE: 'Sur votre site',
  EMBED_CATALOG: 'Tous vos cours',
  EMBED_CATALOG_HINT: 'Vos activités publiées se mettent à jour sans remplacer le code.',
  INLINE: 'Formulaire intégré',
  FLOATING: 'Bouton flottant',
  WEBSITE_HINT:
    'Copiez ce code dans un bloc HTML ou dans les outils de code personnalisé de votre site.',
  WEBSITE_NOTE:
    'Selon votre hébergeur, un accès au code personnalisé et l’autorisation de charger notre domaine peuvent être nécessaires.',
  CATALOG: 'Toutes les activités',
  IFRAME_TITLE: 'Réserver une activité',
  BUTTON: 'Réserver',
  CLOSE: 'Fermer la réservation',
  SELECT_ACTIVITY: 'Choisissez une activité à intégrer',
  NO_ACTIVITY: 'Publiez une activité pour obtenir son intégration.',
  CATALOG_TITLE: 'Choisissez votre prochaine activité.',
  CATALOG_EMPTY: 'Aucune activité publiée pour le moment.',
  LANDING_TITLE: 'Vos événements, simplement.',
  LANDING_HINT:
    'Créez vos activités, partagez votre page et retrouvez vos inscriptions au même endroit.',
  START: 'Créer un compte organisateur',
  LOGIN: 'Se connecter',
  CONNECTED_AS: 'Connecté en tant que',
  OPEN_SPACES: 'Ouvrir mes espaces',
  LANDING_CANCEL_NOTE:
    'Sans engagement. Résiliez à tout moment et conservez votre accès jusqu’à la fin de la période payée.',
  CATALOG_OPEN: 'Choisir une séance',
} as const;
export const SHARING_MODES = [
  ['social', SHARE_UI.SOCIAL_MODE],
  ['website', SHARE_UI.WEBSITE_MODE],
] as const;
export const EMBED = {
  CATALOG_VERSION: 4,
  FLOATING_HEIGHT: 'min(720px, calc(90vh - 88px))',
  BUTTON_RADIUS: '8px',
  SURFACE_RADIUS: '22px',
  RESIZE_TYPE: 'booking-widget:resize',
  RETURN_TYPE: 'booking-widget:return',
  RETURN_SITE: 'Terminer et revenir au site',
  RETURN_TICKET: 'Retour à mon billet',
  MIN_HEIGHT: 320,
  MAX_HEIGHT: 6000,
  INITIAL_HEIGHT: 1000,
};

export const EMBED_COLORS = {
  PAPER: 'rgba(255,255,255,0.55)',
  INK: '#1a1730',
  SHADOW: '#1a17303d',
  SCENE: '#dfe6f5',
  LIGHT: '#ffffffcc',
} as const;
