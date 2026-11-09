'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN } from '../../config/administration';
const tabs = [
  ['/plateforme', ADMIN.OVERVIEW],
  ['/plateforme/operations', ADMIN.OPERATIONS],
  ['/plateforme/historique', ADMIN.HISTORY],
] as const;
export function AdministrationNav() {
  const path = usePathname();
  return (
    <div className="administration-navigation">
      <Link href="/app" className="administration-back">
        ← {ADMIN.BACK}
      </Link>
      <nav className="administration-tabs" aria-label={ADMIN.TITLE}>
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
