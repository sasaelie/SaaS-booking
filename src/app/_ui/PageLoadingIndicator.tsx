'use client';
import { useEffect, useRef } from 'react';
import { PAGE_LOADING } from '../../config/page-loading';
import { IceIcon } from './IceIcon';
import './page-loading.css';
export function PageLoadingIndicator({
  leaving = false,
  onExited,
}: {
  readonly leaving?: boolean;
  readonly onExited?: () => void;
}) {
  const ref = useIndicatorExit(leaving, onExited);
  return (
    <div
      className="page-loading-indicator"
      ref={ref}
      data-leaving={leaving}
      role="status"
      aria-live="polite"
    >
      <div className="page-loading-pebble" aria-hidden="true">
        <IceIcon name="calendar" />
        <div className="page-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
      <p>{PAGE_LOADING.LABEL}</p>
    </div>
  );
}
function useIndicatorExit(leaving: boolean, onExited?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!leaving) return;
    let cancelled = false;
    const animations = ref.current?.getAnimations() ?? [];
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!cancelled) onExited?.();
    });
    return () => {
      cancelled = true;
    };
  }, [leaving, onExited]);
  return ref;
}
