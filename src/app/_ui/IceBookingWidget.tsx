'use client';
import { ParticipationTerms } from './ParticipationTerms';
import { SocialLinks } from './SocialLinks';
import { BrandBackdrop } from './BrandBackdrop';
import type { CSSProperties } from 'react';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { DEFAULTS } from '../../config/constants';
import { BookingBrand } from './BookingBrand';
import { BookingHeader } from './BookingHeader';
import { BookingFlow } from './BookingFlow';
import { PlatformSignature } from './PlatformSignature';
export function IceBookingWidget({ data }: { readonly data: BookingPageData }) {
  const color = /^#[0-9a-f]{6}$/i.test(data.primaryTextColor) ? data.primaryTextColor : DEFAULTS.TEXT_COLOR;
  const style = { '--ui-text-primary': color } as CSSProperties;
  return (
    <div className="ice-widget-root ice-booking-page ice-branded-page" style={style}>
      <BrandBackdrop brand={data.brand} />
      <div className="catalog-identity">
        <BookingBrand name={data.organizationName} logoUrl={data.brand.logoUrl} />
        <SocialLinks links={data.socialLinks} />
      </div>
      <div className="ice-cube-shell ice-booking-shell">
        <BookingHeader data={data} />
        <BookingFlow data={data} />
      </div>
      <ParticipationTerms text={data.terms.fullText} editUrl={data.termsEditUrl} />
      {data.showPlatformSignature ? <PlatformSignature /> : null}
    </div>
  );
}
