import { BrandLogo } from './BrandLogo';
import { BOOKING_UI } from '../../config/constants';
import { IceIcon } from './IceIcon';
export function BookingBrand({
  name,
  logoUrl,
}: {
  readonly name: string;
  readonly logoUrl?: string | null;
}) {
  return (
    <header className="ice-brand">
      <div className="ice-brand-name">
        <BrandLogo src={logoUrl} />
        <span>{name}</span>
      </div>
      <span className="ice-brand-note">
        <IceIcon name="lock" />
        {BOOKING_UI.BRAND_NOTE}
      </span>
    </header>
  );
}
