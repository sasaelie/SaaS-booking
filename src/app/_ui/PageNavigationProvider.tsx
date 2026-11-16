'use client';
import { createContext, useCallback, useState, type ReactNode } from 'react';
import { PageNavigationLoading } from './PageNavigationLoading';
export const PageNavigationContext = createContext<(() => () => void) | null>(null);
export const PageNavigationPendingContext = createContext(false);
export function PageNavigationProvider({ children }: { readonly children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const register = useCallback(() => {
    setPending((count) => count + 1);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      setPending((count) => Math.max(0, count - 1));
    };
  }, []);
  return (
    <PageNavigationContext.Provider value={register}>
      <PageNavigationPendingContext.Provider value={pending > 0}>
        {children}
        <PageNavigationLoading pending={pending > 0} />
      </PageNavigationPendingContext.Provider>
    </PageNavigationContext.Provider>
  );
}
