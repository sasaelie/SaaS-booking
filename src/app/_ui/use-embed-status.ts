'use client';
import { useEffect } from 'react';
import { EMBED_HEALTH as H } from '../../config/embed-health';
import { EmbedPingSchema } from '../../core/validation/embed-health';
import { embedParentOrigin } from '../../lib/embed-health';
export function useEmbedStatus(available: boolean) {
  useEffect(() => {
    if (window.parent === window) return;
    const announce = () =>
      window.parent.postMessage(
        {
          type: H.READY,
          version: H.VERSION,
          status: available ? 'ready' : 'unavailable',
        },
        '*',
      );
    announce();
    function check(event: MessageEvent<unknown>) {
      if (
        event.source === window.parent &&
        embedParentOrigin(event.origin) &&
        EmbedPingSchema.safeParse(event.data).success
      )
        announce();
    }
    window.addEventListener('message', check);
    return () => {
      window.removeEventListener('message', check);
    };
  }, [available]);
}
