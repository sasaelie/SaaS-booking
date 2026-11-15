'use client';
import Link, { useLinkStatus } from 'next/link';
import { useContext, useEffect, type ComponentProps } from 'react';
import { PageNavigationContext } from './PageNavigationProvider';
export function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingSignal />
    </Link>
  );
}
function PendingSignal() {
  const { pending } = useLinkStatus();
  const register = useContext(PageNavigationContext);
  useEffect(() => (pending && register ? register() : undefined), [pending, register]);
  return null;
}
