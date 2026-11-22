'use client';
import { useEffect } from 'react';
import { EMBED } from '../../config/constants';
import { useEmbedStatus } from './use-embed-status';
export function EmbedHeightReporter({ available = true }: { readonly available?: boolean }) {
  useEmbedStatus(available);
  useEffect(() => {
    const element = document.body;
    function report() {
      window.parent.postMessage(
        {
          type: EMBED.RESIZE_TYPE,
          height: Math.max(EMBED.MIN_HEIGHT, Math.ceil(element.getBoundingClientRect().height)),
        },
        '*',
      );
    }
    const observer = new ResizeObserver(report);
    observer.observe(element);
    report();
    return () => observer.disconnect();
  }, []);
  return null;
}
