export const ADMIN_CODES = {
  TABS: [
    ['passkey', 'Biométrie'],
    ['totp', 'Application'],
    ['email', 'E-mail'],
  ],
  CHECKING: 'Vérification de la compatibilité du navigateur…',
  TOTP_VERIFY_NOTE:
    'Saisissez le code actuel de votre application. Si vous venez de l’utiliser, attendez son renouvellement.',
  RATE_LIMITED:
    'Trop de demandes. Attendez avant de réessayer ou utilisez une autre méthode déjà configurée. Les envois d’e-mails sont limités à trois par heure.',
  TOTP: 'Application d’authentification',
  EMAIL: 'Code par e-mail',
  PASSKEY: 'Clé d’accès / biométrie',
  CHOOSE: 'Choisissez votre méthode',
  HELP: 'Vous pouvez utiliser une application d’authentification ou un e-mail dans votre navigateur habituel. La clé d’accès est disponible lorsque le navigateur le permet.',
  TOTP_NOTE:
    'Configurez une application comme Google Authenticator, Microsoft Authenticator ou 2FAS sur ce téléphone. Choisissez la saisie manuelle d’une clé : aucun QR code à scanner.',
  TOTP_SETUP: 'Configurer l’application',
  TOTP_SECRET: 'Clé de configuration à recopier dans l’application',
  TOTP_ACCOUNT: 'Nom du compte',
  TOTP_KIND: 'Type : basé sur le temps · 6 chiffres · 30 secondes',
  TOTP_SECRET_NOTE:
    'Cette clé permet de générer vos codes. Conservez-la dans votre application d’authentification et ne la partagez pas. Confirmez avec le premier code affiché.',
  TOTP_CONFIRM: 'Confirmer le code de l’application',
  TOTP_VERIFY: 'Vérifier le code de l’application',
  TOTP_ACTIVE: 'Application configurée',
  TOTP_REPLACE: 'Remplacer l’application',
  TOTP_REMOVE: 'Retirer l’application',
  EMAIL_SETUP: 'Configurer l’e-mail',
  EMAIL_SEND: 'Recevoir un code par e-mail',
  EMAIL_VERIFY: 'Vérifier le code reçu',
  EMAIL_ACTIVE: 'E-mail configuré',
  EMAIL_REMOVE: 'Retirer la méthode e-mail',
  EMAIL_NOTE:
    'Le code sera envoyé uniquement à l’adresse vérifiée de votre compte. Cette méthode dépend aussi de la sécurité de votre boîte mail.',
  EMAIL_UNAVAILABLE:
    'L’envoi des codes par e-mail n’est pas encore configuré sur cet environnement. Les autres méthodes restent disponibles.',
  EMAIL_SENT:
    'La demande d’envoi a été acceptée. Consultez votre boîte mail et vos courriers indésirables. Seul le dernier code reçu pour cette demande est utilisable.',
  EMAIL_EXPIRY: 'Le code expire après 5 minutes et fonctionne une seule fois.',
  EMAIL_RETRY: 'Nouvel envoi disponible dans',
  EMAIL_SUBJECT: 'Votre code de vérification pour l’administration',
  EMAIL_TEXT: 'Confirmez votre accès à l’administration de Studio Créatif 360 avec ce code :',
  EMAIL_FOOTER:
    'Ce code expire après 5 minutes et fonctionne une seule fois. Si vous n’avez pas demandé cette vérification, ignorez ce message et vérifiez la sécurité de votre compte. Ne communiquez jamais ce code à une autre personne.',
  CODE: 'Code à 6 chiffres',
  INVALID: 'Code incorrect, expiré ou déjà utilisé. Vérifiez le code et réessayez.',
  LOCKED:
    'Trop de tentatives. Réessayez dans 15 minutes, ou utilisez une autre méthode déjà configurée ou un code de secours.',
  NOT_CONFIGURED: 'À configurer',
  READY: 'Configurée',
  METHOD_NOT_READY:
    'Pour ajouter cette méthode, vérifiez d’abord une méthode déjà configurée ou utilisez un code de secours ci-dessous.',
  BIOMETRIC_UNAVAILABLE:
    'La clé d’accès n’est pas disponible dans ce navigateur. Vous pouvez utiliser l’application d’authentification ou l’e-mail ci-dessous.',
  REMOVE_NOTE:
    'Une autre méthode confirmée doit rester disponible pendant que la protection est activée.',
  COPY_SECRET: 'Copier la clé de configuration',
  COPIED: 'Clé copiée.',
  MANAGE: 'Gérer mes méthodes',
  DIGITS: 6,
  RADIX: 10,
  PERIOD_SECONDS: 30,
  WINDOW: 1,
  SECRET_BYTES: 20,
  SETUP_SECONDS: 600,
  EMAIL_SECONDS: 300,
  EMAIL_COOLDOWN_SECONDS: 60,
  EMAIL_MAX_SENDS: 3,
  EMAIL_WINDOW_SECONDS: 3600,
  MAX_FAILURES: 6,
  LOCK_SECONDS: 900,
  SEND_TIMEOUT_MS: 8000,
  PAYLOAD_MAX: 4096,
  INITIAL_COUNTER: -1,
} as const;
export function isLocalAdministratorMailTest(input: Readonly<Record<string, string | undefined>>) {
  if (input['STAGING_BROWSER_TEST'] !== 'true' || input['APP_ENVIRONMENT'] !== 'staging')
    return false;
  if (!/^postgresql:\/\/[^@]+@127\.0\.0\.1:[0-9]+\/booking_test$/.test(input['DATABASE_URL'] ?? ''))
    return false;
  try {
    return ['localhost', '127.0.0.1'].includes(
      new URL(input['NEXT_PUBLIC_APP_URL'] ?? '').hostname,
    );
  } catch {
    return false;
  }
}
