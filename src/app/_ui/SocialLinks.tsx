import type { SocialLinks as Links } from '../../core/ports/event-details';
import { SERVICE, SOCIAL_NETWORKS } from '../../config/service';
import { SOCIAL_ICONS as icons } from '../../config/social-icons';
export function SocialLinks({ links = {} }: { readonly links?: Links }) {
  const entries = Object.entries(SOCIAL_NETWORKS).filter(([key]) => links[key as keyof Links]);
  if (!entries.length) return null;
  return (
    <nav className="social-links" aria-label={SERVICE.SOCIALS}>
      {entries.map(([key, label]) => (
        <a
          className="social-link"
          key={key}
          href={links[key as keyof Links]}
          aria-label={label}
          title={label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
            <path d={icons[key as keyof typeof icons]} />
          </svg>
        </a>
      ))}
    </nav>
  );
}
