import type { PlatformPublicProfile } from '../../../core/validation/platform-settings';
import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
import { SOCIAL_NETWORKS, SERVICE } from '../../../config/service';
import { CONTACT } from '../../../config/contact';
import { PortalField } from '../PortalField';
const companyFields = [
  ['name', UI.NAME],
  ['address', UI.ADDRESS],
  ['businessNumber', UI.BUSINESS],
  ['vatNumber', UI.VAT],
  ['taxStatus', UI.TAX],
] as const;
export function ProfileFields({ profile }: { readonly profile: PlatformPublicProfile }) {
  return (
    <>
      <fieldset className="portal-fieldset">
        <legend>{UI.COMPANY}</legend>
        <div className="portal-form-grid">
          {companyFields.map(([name, label]) => (
            <PortalField
              key={name}
              name={name}
              label={label}
              defaultValue={profile[name]}
              maxLength={
                name === 'address'
                  ? UI.ADDRESS_MAX
                  : name === 'taxStatus'
                    ? UI.TAX_MAX
                    : UI.LEGAL_MAX
              }
              autoComplete={
                name === 'name' ? 'organization' : name === 'address' ? 'street-address' : undefined
              }
            />
          ))}
        </div>
      </fieldset>
      <ContactProfileFields profile={profile} />
      <SocialProfileFields profile={profile} />
    </>
  );
}
function ContactProfileFields({ profile }: { readonly profile: PlatformPublicProfile }) {
  return (
    <fieldset className="portal-fieldset">
      <legend>{UI.CONTACT}</legend>
      <div className="portal-form-grid">
        <PortalField
          name="email"
          label={UI.EMAIL}
          type="email"
          defaultValue={profile.email}
          autoComplete="email"
        />
        <PortalField
          name="phone"
          label={UI.PHONE}
          type="tel"
          defaultValue={profile.phone}
          maxLength={CONTACT.INPUT_MAX}
          pattern={CONTACT.INPUT_PATTERN}
          autoComplete="tel"
        />
      </div>
    </fieldset>
  );
}
function SocialProfileFields({ profile }: { readonly profile: PlatformPublicProfile }) {
  return (
    <details className="portal-details">
      <summary>{UI.SOCIALS}</summary>
      <div className="portal-form-grid">
        {Object.entries(SOCIAL_NETWORKS).map(([key, label]) => (
          <PortalField
            key={key}
            name={`social-${key}`}
            label={label}
            type="url"
            pattern={SERVICE.SOCIAL_PATTERN}
            defaultValue={profile.socialLinks[key as keyof typeof profile.socialLinks] ?? ''}
            maxLength={SERVICE.URL_MAX}
            hint={SERVICE.SOCIAL_HINT}
          />
        ))}
      </div>
    </details>
  );
}
