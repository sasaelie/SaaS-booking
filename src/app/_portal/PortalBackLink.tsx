'use client';
import { AppLink as Link } from '../_ui/AppLink';
import { usePathname } from 'next/navigation';
import type { ReactNode, MouseEvent } from 'react';
import { SESSION_EXIT } from '../../config/session-exit';
export function PortalBackLink({
  href,
  label,
  className,
  children,
}: {
  readonly href: string;
  readonly label: string;
  readonly className: string;
  readonly children: ReactNode;
}) {
  const path = usePathname();
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    if (
      path !== '/app' ||
      href !== '/' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    window.dispatchEvent(new Event(SESSION_EXIT.EVENT));
  }
  return (
    <Link href={href} aria-label={label} className={className} onClick={follow}>
      {children}
    </Link>
  );
}
