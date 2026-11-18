'use client';
import { useEffect } from 'react';
import { EMBED } from '../../config/constants';
export function EmbedHeightReporter() {
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
