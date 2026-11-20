import { PUBLIC_DOCUMENT_UI as UI } from '../../config/public-documents';
import { publicPlatformProfile } from '../../composition/public-platform-profile';
import { PublicProfileDetails } from './PublicProfileDetails';
import type { PlatformPublicProfile } from '../../core/validation/platform-settings';
export async function PublicIdentity() {
  const profile = await publicPlatformProfile();
  const fields = [
    [UI.LEGAL_NAME, profile.name],
    [UI.ADDRESS, profile.address],
    [UI.BUSINESS_NUMBER, profile.businessNumber],
    [UI.VAT_NUMBER, profile.vatNumber],
    [UI.TAX_STATUS, profile.taxStatus],
  ] as const;
  return (
    <section className="portal-panel marketing-document-identity">
      <h2>{UI.IDENTITY_TITLE}</h2>
      <dl>
        {fields.map(([label, value]) => (
          <IdentityRow key={label} label={label} value={value} />
        ))}
        <ContactRows profile={profile} />
      </dl>
    </section>
  );
}
function IdentityRow({
  label,
  value,
  href,
}: {
  readonly label: string;
  readonly value: string | null;
  readonly href?: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {href && value ? (
          <a className="marketing-text-link" href={href}>
            {value}
          </a>
        ) : (
          <span className={value ? undefined : 'marketing-missing-value'}>
            {value || UI.TO_COMPLETE}
          </span>
        )}
      </dd>
    </div>
  );
}
function ContactRows({ profile }: { readonly profile: PlatformPublicProfile }) {
  const { email, phone } = profile;
  return (
    <>
      <IdentityRow label={UI.EMAIL} value={email} href={email ? `mailto:${email}` : undefined} />
      <IdentityRow label={UI.PHONE} value={phone} href={phone ? `tel:${phone}` : undefined} />
    </>
  );
}
export async function PublicContactDetails() {
  const profile = await publicPlatformProfile();
  return <PublicProfileDetails profile={profile} emptyMessage={UI.CONTACT_PENDING} />;
}
