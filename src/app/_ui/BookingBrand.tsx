import { BOOKING_UI } from '../../config/constants';
import { IceIcon } from './IceIcon';
export function BookingBrand({ name }: { readonly name: string }) {
  return (
    <header className="ice-brand">
      <div className="ice-brand-name">
        <span className="ice-brand-mark" aria-hidden="true" />
        <span>{name}</span>
      </div>
      <span className="ice-brand-note">
        <IceIcon name="lock" />
        {BOOKING_UI.BRAND_NOTE}
      </span>
    </header>
  );
}
