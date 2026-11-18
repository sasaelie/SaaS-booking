'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export function AdministrationTabStrip({
  children,
  label,
  activeKey,
  className = '',
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly activeKey: string;
  readonly className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const update = () => revealActive(nav);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeKey]);
  return (
    <nav className={`administration-tabs ${className}`} aria-label={label} ref={ref}>
      {children}
    </nav>
  );
}
function revealActive(nav: HTMLElement) {
  const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
  if (!active) return;
  const bounds = nav.getBoundingClientRect(),
    item = active.getBoundingClientRect();
  if (item.left < bounds.left) nav.scrollLeft += item.left - bounds.left;
  else if (item.right > bounds.right) nav.scrollLeft += item.right - bounds.right;
}
