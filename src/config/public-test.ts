export const PUBLIC_TEST = {
  SCHEMA: 'booking_public_test',
  NOTICE:
    'Démonstration publique TEST : aucune place réelle, aucun paiement ni e-mail. Utilisez des coordonnées fictives ; seules des coordonnées de test sont enregistrées.',
  PRIVATE_NOTICE:
    'Cette recette est privée : son lien et son code ne peuvent pas être installés sur un site public. Utilisez l’aperçu privé en attendant la publication.',
  SHARING_NOTICE:
    'Installation publique de TEST : les réservations sont fictives et séparées de votre espace organisateur.',
  PAYMENT_NOTE: 'Simulation : tarif de la séance conservé, aucun paiement réel à effectuer.',
  PAYMENT_SUCCESS: 'Paiement de test réussi — aucun montant débité.',
  AMOUNT_LABEL: 'Montant simulé',
  FIRST_NAME: 'Participant',
  LAST_NAME: 'TEST',
  EMAIL: 'participant@example.invalid',
  PHONE: '+32000000000',
} as const;
type Settings = {
  readonly [key: string]: string | undefined;
  readonly PUBLIC_TEST_MODE?: string;
  readonly PUBLIC_TEST_ORGANIZATION_ID?: string;
  readonly PUBLIC_TEST_ORGANIZATION_SLUG?: string;
};
export function publicTestEnabled(settings: Settings = process.env) {
  return settings.PUBLIC_TEST_MODE === 'true';
}
export function publicTestPath(path: string, settings: Settings) {
  const slug = settings.PUBLIC_TEST_ORGANIZATION_SLUG;
  const organizationId = settings.PUBLIC_TEST_ORGANIZATION_ID;
  if (
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !organizationId ||
    path.includes('%') ||
    path.includes('\\')
  )
    return false;
  const organization = '[a-z0-9]+(?:-[a-z0-9]+)*';
  const segment = path.replace(/^\/embed\//, '/').split('/')[1];
  const activity = '[0-9a-f-]{36}';
  return (
    (new RegExp(`^/(?:embed/)?${organization}(?:/${activity})?$`).test(path) &&
      !PUBLIC_TEST_RESERVED.includes(segment ?? '')) ||
    new RegExp(`^/api/branding/${activity}/(?:logo|background)$`).test(path) ||
    /^\/api\/(?:self-service(?:\/context)?|voucher-quote|participant\/(?:exchange|test\/(?:context|cancel)))$/.test(
      path,
    ) ||
    ['/connexion', '/manage', '/widget.js', '/favicon.ico', '/robots.txt'].includes(path) ||
    /^\/(?:_next\/(?:static|image)|fonts|images)\//.test(path)
  );
}

const PUBLIC_TEST_RESERVED = [
  'app',
  'plateforme',
  'apercu-site',
  'apercu-site-prive',
  'api',
  'simulation',
  'embed',
  'compte',
  'inscription',
  'mot-de-passe-oublie',
  'nouveau-mot-de-passe',
  'booking-result',
  'apercu-chargement',
  'accessibilite',
  'confidentialite',
  'mentions-legales',
  'conditions',
  'faq',
  'contact',
];

export function publicTestCatalogSlug(path: string) {
  const slug = path.match(/^\/(?:embed\/)?([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[0-9a-f-]{36})?$/)?.[1];
  return slug && !PUBLIC_TEST_RESERVED.includes(slug) && !['connexion', 'manage'].includes(slug)
    ? slug
    : null;
}
