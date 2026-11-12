import { CONTACT } from '../../config/contact';
import { SERVICE, SOCIAL_NETWORKS } from '../../config/service';
import type { SocialLinks } from '../../core/ports/event-details';
import { PortalField } from './PortalField';
export function SocialSettings({ links = {} }: { readonly links?: SocialLinks }) {
  return (
    <details className="portal-details">
      <summary>{SERVICE.SOCIALS}</summary>
      <div className="portal-form-grid">
        <PortalField
          label={CONTACT.PHONE}
          name="contactPhone"
          type="tel"
          autoComplete="tel"
          hint={CONTACT.HINT}
          maxLength={CONTACT.INPUT_MAX}
          pattern={CONTACT.INPUT_PATTERN}
          defaultValue={links.phone ?? ''}
        />

        {Object.entries(SOCIAL_NETWORKS).map(([key, label]) => (
          <PortalField
            key={key}
            label={label}
            name={`social-${key}`}
            type="url"
            pattern={SERVICE.SOCIAL_PATTERN}
            hint={SERVICE.SOCIAL_HINT}
            placeholder="https://…"
            maxLength={SERVICE.URL_MAX}
            defaultValue={links[key as keyof SocialLinks] ?? ''}
          />
        ))}
      </div>
    </details>
  );
}
