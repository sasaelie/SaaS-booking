'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { PAGE_LOADING } from '../../config/page-loading';
export function useNavigationLoading(pending: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'hidden' | 'loading' | 'leaving'>('hidden');
  useEffect(() => {
    if (pending) {
      if (ref.current) {
        ref.current.style.setProperty(
          '--page-loading-enter-from',
          getComputedStyle(ref.current).opacity,
        );
        setPhase('loading');
        return;
      }
      const timer = window.setTimeout(() => setPhase('loading'), PAGE_LOADING.DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    const element = ref.current;
    const opacity = element ? Number(getComputedStyle(element).opacity) : 0;
    if (!element || opacity === 0) {
      setPhase('hidden');
      return;
    }
    element.style.setProperty('--page-loading-exit-from', String(opacity));
    setPhase('leaving');
  }, [pending]);
  useExitAnimation(ref, phase === 'leaving' && !pending, () => setPhase('hidden'));
  return { ref, phase };
}
function useExitAnimation(
  ref: RefObject<HTMLDivElement | null>,
  leaving: boolean,
  onExited: () => void,
) {
  useEffect(() => {
    if (!leaving) return;
    let cancelled = false;
    const animations = ref.current?.getAnimations() ?? [];
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!cancelled) onExited();
    });
    return () => {
      cancelled = true;
    };
  }, [ref, leaving, onExited]);
}
