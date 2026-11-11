'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionEntryPath, isSessionNavigationPath } from '../../lib/session-navigation';
export function SessionHistorySync() {
  const router = useRouter();
  useEffect(() => {
    let frame: number | undefined;
    function refresh() {
      if (!isSessionNavigationPath(window.location.pathname)) return;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => router.refresh());
    }
    function restored(event: PageTransitionEvent) {
      if (event.persisted) refresh();
    }
    function focused() {
      if (isSessionEntryPath(window.location.pathname)) refresh();
    }
    window.addEventListener('popstate', refresh);
    window.addEventListener('pageshow', restored);
    window.addEventListener('focus', focused);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener('popstate', refresh);
      window.removeEventListener('pageshow', restored);
      window.removeEventListener('focus', focused);
    };
  }, [router]);
  return null;
}
