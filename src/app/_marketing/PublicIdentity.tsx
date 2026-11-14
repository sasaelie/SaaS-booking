import { PUBLIC_DOCUMENT_UI as UI } from '../../config/public-documents';
import { publicProfile } from '../../lib/public-profile';
export function PublicIdentity() {
  const profile = publicProfile();
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
        <ContactRows />
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
            {value ?? UI.TO_COMPLETE}
          </span>
        )}
      </dd>
    </div>
  );
}
function ContactRows() {
  const { email, phone } = publicProfile();
  return (
    <>
      <IdentityRow label={UI.EMAIL} value={email} href={email ? `mailto:${email}` : undefined} />
      <IdentityRow label={UI.PHONE} value={phone} href={phone ? `tel:${phone}` : undefined} />
    </>
  );
}
export function PublicContactDetails() {
  return (
    <dl>
      <ContactRows />
    </dl>
  );
}
