import type { PlatformPublicProfile } from '../../core/validation/platform-settings';
import { PLATFORM_SETTINGS as UI } from '../../config/platform-settings';
import { SocialLinks } from '../_ui/SocialLinks';
export function PublicProfileDetails({
  profile,
  legal = false,
  emptyMessage = UI.EMPTY,
}: {
  readonly profile: PlatformPublicProfile;
  readonly legal?: boolean;
  readonly emptyMessage?: string;
}) {
  const items = [
    [UI.NAME, profile.name],
    [UI.ADDRESS, profile.address],
    ...(legal
      ? [
          [UI.BUSINESS, profile.businessNumber],
          [UI.VAT, profile.vatNumber],
          [UI.TAX, profile.taxStatus],
        ]
      : []),
  ];
  const hasContact = Boolean(
    profile.email || profile.phone || Object.values(profile.socialLinks).some(Boolean),
  );
  return (
    <div className="platform-public-contact">
      {!hasContact && !items.some(([, value]) => value) ? (
        <p className="portal-muted">{emptyMessage}</p>
      ) : null}
      <dl>
        <ProfileIdentityRows items={items} />
        <ProfileContactRows profile={profile} />
      </dl>
      <SocialLinks links={profile.socialLinks} />
    </div>
  );
}
function ProfileIdentityRows({ items }: { readonly items: readonly (readonly string[])[] }) {
  return items
    .filter(([, value]) => value)
    .map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ));
}
function ProfileContactRows({ profile }: { readonly profile: PlatformPublicProfile }) {
  return (
    <>
      {profile.email ? (
        <div>
          <dt>{UI.EMAIL}</dt>
          <dd>
            <a className="marketing-text-link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </dd>
        </div>
      ) : null}
      {profile.phone ? (
        <div>
          <dt>{UI.PHONE}</dt>
          <dd>
            <a className="marketing-text-link" href={`tel:${profile.phone}`}>
              {profile.phone}
            </a>
          </dd>
        </div>
      ) : null}
    </>
  );
}
