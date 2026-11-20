export const WEBSITE_PREVIEW = {
  SLUG: 'studiocreatif360',
  SOURCE_URL: 'https://studio-creatif-360.vercel.app',
  SOURCE_REVISION: 'a146837a2ad93754e52ad1e0b04781b8fcd26b94',
  PATH: '/apercu-site',
  LINK: 'Voir l’aperçu privé sur mon site',
  MODE: 'staging',
  OWNER: 'OWNER',
  TITLE: 'Aperçu privé — Studio Créatif 360',
  BOOKING_TITLE: 'Réservez votre prochain atelier',
  BOOKING_DESCRIPTION: 'Choisissez votre cours et votre créneau, directement depuis le site.',
  FRAME_TITLE: 'Réservation — simulation de test',
  NOTE: 'Aperçu privé · Réservations de test uniquement',
  HINT: 'Choisissez un cours et un créneau. Aucun paiement réel, aucun e-mail envoyé et aucune place réelle occupée.',
  TEMPLATE_FILE: 'src/adapters/preview/studio-website.html',
  NONCE_MARKER: '__PREVIEW_CSP_NONCE__',
} as const;
export function websitePreviewPath(slug: string, activityId?: string) {
  return `/embed/${slug}/preview${activityId ? `/${activityId}` : ''}`;
}
export function isWebsitePreviewFrame(path: string) {
  return /^\/embed\/[^/]+\/preview(?:\/|$)/.test(path);
}
