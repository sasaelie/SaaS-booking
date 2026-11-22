import { EMBED } from '../config/constants';
import { EMBED_HEALTH } from '../config/embed-health';
import { EmbedCheckUrlSchema } from '../core/validation/embed-health';
export function embedInstallCode(
  appUrl: string,
  slug: string,
  mode: 'inline' | 'floating',
  activityId?: string,
) {
  const origin = new URL(appUrl).origin;
  const route = `/${encodeURIComponent(slug)}${activityId ? '/' + encodeURIComponent(activityId) : ''}`;
  const attributes = `data-organization="${attribute(slug)}"${activityId ? ` data-activity="${attribute(activityId)}"` : ''} data-mode="${mode}"`;
  return `<a href="${attribute(origin + route)}" data-booking-fallback target="_blank" rel="noopener noreferrer">${EMBED_HEALTH.OPEN}</a>\n<script src="${attribute(origin)}/widget.js?v=${EMBED.CATALOG_VERSION}" ${attributes} defer></script>`;
}
export function embedCheckUrl(value: string, slug: string) {
  const parsed = EmbedCheckUrlSchema.safeParse(value);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  url.searchParams.set(EMBED_HEALTH.DIAGNOSTIC_PARAM, slug);
  return url.href;
}
function attribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
