export const EMBED_HEALTH = {
  VERSION: 1,
  READY: 'booking-widget:ready',
  PING: 'booking-widget:ping',
  TIMEOUT_MS: 15000,
  SLOW_MS: 6000,
  DIAGNOSTIC_PARAM: 'booking_widget_check',
  LOADING: 'Connexion au calendrier…',
  SLOW: 'Le calendrier prend un peu plus de temps à répondre…',
  FAILED:
    'Le calendrier ne répond pas. Réessayez ou ouvrez la réservation dans une nouvelle fenêtre.',
  UNAVAILABLE:
    'Ce calendrier est actuellement indisponible. Vous pouvez ouvrir la page de réservation.',
  RETRY: 'Réessayer',
  OPEN: 'Ouvrir la réservation dans une nouvelle fenêtre',
  READY_NOTE: 'Intégration confirmée : le calendrier a répondu sur cette page.',
  HELP_TITLE: 'Vérifier l’intégration',
  CHECK: 'Vérifier l’accès au calendrier',
  CHECK_NOTE:
    'Ce contrôle vérifie la réponse du calendrier. Les règles de votre site se vérifient ensuite sur sa page publiée.',
  CHECK_READY: 'Le calendrier est accessible en intégration.',
  CHECK_PRIVATE:
    'Cette adresse est une recette privée. Un contrôle réussi dans votre session ne confirme pas son accès aux visiteurs de votre site.',
  SITE_TITLE: 'Contrôler sur mon site',
  SITE_LABEL: 'Adresse de la page où vous avez installé le calendrier',
  SITE_HINT:
    'Ouvrez la page publiée. Le message « Intégration confirmée » apparaîtra si votre calendrier répond. Aucun résultat n’est enregistré automatiquement dans votre compte.',
  SITE_OPEN: 'Ouvrir le contrôle sur mon site',
  SITE_INVALID: 'Indiquez une adresse HTTPS complète, sans identifiants dans l’adresse.',
  SITE_MISSING:
    'Si aucun message de confirmation n’apparaît, vérifiez le code installé et les autorisations de votre hébergeur.',
  CHECK_PRIVATE_READY: 'Le calendrier répond dans cette session privée.',
  LOCAL_HOSTS: ['localhost', '127.0.0.1'],
} as const;
