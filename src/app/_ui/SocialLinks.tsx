import { CONTACT } from '../../config/contact';
import { contactPhoneHref } from '../../core/domain/contact-phone';
import type { SocialLinks as Links } from '../../core/ports/event-details';
import { SERVICE, SOCIAL_NETWORKS } from '../../config/service';
import { SOCIAL_ICONS as icons } from '../../config/social-icons';
export function SocialLinks({ links = {} }: { readonly links?: Links }) {
  const entries: { key: string; label: string; href: string }[] = Object.entries(SOCIAL_NETWORKS)
    .filter(([key]) => links[key as keyof Links])
    .map(([key, label]) => ({ key, label, href: links[key as keyof Links] ?? '' }));
  const phone = contactPhoneHref(links.phone);
  if (phone) entries.unshift({ key: 'phone', label: CONTACT.CALL, href: phone });
  if (!entries.length) return null;
  return (
    <nav className="social-links" aria-label={SERVICE.SOCIALS}>
      {entries.map(({ key, label, href }) => (
        <a
          className="social-link"
          key={key}
          href={href}
          aria-label={label}
          title={label}
          target={key === 'phone' ? undefined : '_blank'}
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
