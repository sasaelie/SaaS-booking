import { EmbedReadySchema } from '../core/validation/embed-health';
import { EMBED_HEALTH } from '../config/embed-health';
type FrameEvent = { readonly origin: string; readonly source: unknown; readonly data: unknown };
export function embedReady(event: FrameEvent, source: unknown, origin: string) {
  if (!source || event.source !== source || event.origin !== origin) return null;
  const result = EmbedReadySchema.safeParse(event.data);
  return result.success ? result.data.status : null;
}
export function embedParentOrigin(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && EMBED_HEALTH.LOCAL_HOSTS.some((host) => host === url.hostname))
    );
  } catch {
    return false;
  }
}
