'use client';
import { useEffect, useState, type Dispatch } from 'react';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import type { DemoAction, DemoState } from './demo-state';
export function useDemoPlayback(state: DemoState, dispatch: Dispatch<DemoAction>) {
  const visible = useDemoVisibility();
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!motion.matches && !document.hidden) dispatch({ type: 'play' });
    const pause = () => {
      if (motion.matches || document.hidden) dispatch({ type: 'pause' });
    };
    motion.addEventListener('change', pause);
    document.addEventListener('visibilitychange', pause);
    return () => {
      motion.removeEventListener('change', pause);
      document.removeEventListener('visibilitychange', pause);
    };
  }, [dispatch]);
  useEffect(() => {
    if (!state.playing || !visible) return;
    const timer = window.setTimeout(
      () => dispatch({ type: state.booked ? 'next' : 'book' }),
      state.booked ? UI.RESULT_DELAY_MS : UI.SELECTION_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state.playing, state.booked, state.exampleIndex, visible, dispatch]);
}
function useDemoVisibility() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const states = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) states.set(entry.target, entry.isIntersecting);
      setVisible([...states.values()].some(Boolean));
    });
    document
      .querySelectorAll('[data-booking-demo]')
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return visible;
}
