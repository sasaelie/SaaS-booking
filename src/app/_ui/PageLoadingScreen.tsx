'use client';
import { useContext, useEffect, useState } from 'react';
import { PageLoadingIndicator } from './PageLoadingIndicator';
import { PageNavigationContext, PageNavigationPendingContext } from './PageNavigationProvider';
import './page-loading-screen.css';
export function PageLoadingScreen() {
  const register = useContext(PageNavigationContext);
  const pending = useContext(PageNavigationPendingContext);
  const [continuation] = useState(pending);
  useEffect(() => (continuation && register ? register() : undefined), [continuation, register]);
  return (
    <div className="page-loading-screen" data-page-loading="">
      <PageLoadingIndicator />
    </div>
  );
}
