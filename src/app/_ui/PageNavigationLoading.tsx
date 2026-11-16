'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { PageLoadingIndicator } from './PageLoadingIndicator';
import { useNavigationLoading } from './use-navigation-loading';
import './page-navigation-loading.css';
export function PageNavigationLoading({ pending }: { readonly pending: boolean }) {
  const { ref, phase } = useNavigationLoading(pending);
  const bounds = usePendingRegion(pending);
  if (phase === 'hidden') return null;
  return (
    <div
      className="page-navigation-loading"
      ref={ref}
      style={bounds}
      data-page-loading=""
      data-leaving={phase === 'leaving'}
    >
      <PageLoadingIndicator />
    </div>
  );
}
function usePendingRegion(pending: boolean) {
  const [bounds, setBounds] = useState<CSSProperties>({});
  useEffect(() => {
    if (!pending) return;
    const region = document.querySelector('.portal-main') ?? document.querySelector('main');
    const busy = region?.getAttribute('aria-busy');
    region?.setAttribute('aria-busy', 'true');
    const update = () => setBounds(navigationBounds());
    update();
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
      if (busy === null) region?.removeAttribute('aria-busy');
      else if (busy !== undefined) region?.setAttribute('aria-busy', busy);
    };
  }, [pending]);
  return bounds;
}
function navigationBounds(): CSSProperties {
  const main = document.querySelector('.portal-main') ?? document.querySelector('main');
  if (!main) return {};
  const rect = main.getBoundingClientRect();
  const menu = (
    document.querySelector('.portal-sidebar') ?? document.querySelector('.marketing-header')
  )?.getBoundingClientRect();
  const stacked = menu && menu.right > rect.left;
  return {
    top: Math.max(0, rect.top, stacked ? menu.bottom : 0),
    left: Math.max(0, rect.left),
    right: Math.max(0, window.innerWidth - rect.right),
  };
}
