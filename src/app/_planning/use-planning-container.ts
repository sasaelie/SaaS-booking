'use client';
import { useEffect, useRef, useState } from 'react';
import { PLANNING } from '../../config/planning';
export function usePlanningContainer() {
  const [compact, setCompact] = useState(true);
  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const update = () => setCompact(element.getBoundingClientRect().width < PLANNING.COMPACT_WIDTH);
    const observer = new ResizeObserver(update);
    update();
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { compact, container };
}
