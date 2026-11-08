import { ColorScene } from './ColorScene';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
export function BrandBackdrop({ brand }: { readonly brand: BookingPageData['brand'] }) {
  return (
    <div className="ice-brand-scene" data-theme={brand.theme} aria-hidden="true">
      {brand.hue != null ? <ColorScene hue={brand.hue} /> : null}
      {brand.backgroundUrl ? <img src={brand.backgroundUrl} alt="" /> : null}
    </div>
  );
}
