'use client';
import { useEffect } from 'react';
import { EMBED } from '../../config/constants';
export function EmbedHeightReporter() {
  useEffect(() => {
    const element = document.querySelector('.booking-embed');
    if (!element) return;
    function report() {
      if (!element) return;
      window.parent.postMessage(
        { type: EMBED.RESIZE_TYPE, height: Math.ceil(element.getBoundingClientRect().height) },
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
