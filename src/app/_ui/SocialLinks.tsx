import type { SocialLinks as Links } from '../../core/ports/event-details';
import { SERVICE, SOCIAL_NETWORKS } from '../../config/service';
const icons = {
  facebook: 'M14 21v-8h3l.5-4H14V7c0-1 1-1 2-1h2V2h-3c-4 0-5 3-5 5v2H7v4h3v8',
  instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1-5h.01',
  whatsapp: 'm3 21 1-5a9 9 0 1 1 4 4l-5 1Zm5-14c0 5 4 9 9 9l1-3-3-1-1 1-3-3 1-1-1-3-3 1Z',
  youtube: 'M3 5h18v14H3V5Zm7 3 6 4-6 4V8Z',
  tiktok: 'M14 3v12a4 4 0 1 1-4-4m4-8c0 4 3 5 6 5',
  website: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
} as const;
export function SocialLinks({ links = {} }: { readonly links?: Links }) {
  const entries = Object.entries(SOCIAL_NETWORKS).filter(([key]) => links[key as keyof Links]);
  if (!entries.length) return null;
  return (
    <nav className="social-links" aria-label={SERVICE.SOCIALS}>
      {entries.map(([key, label]) => (
        <a
          key={key}
          href={links[key as keyof Links]}
          aria-label={label}
          title={label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={icons[key as keyof typeof icons]} />
          </svg>
        </a>
      ))}
    </nav>
  );
}
