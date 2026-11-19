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
import { useBookingFlow } from './use-booking-flow';
export function IceBookingWidget({
  data,
  embedded = false,
}: {
  readonly data: BookingPageData;
  readonly embedded?: boolean;
}) {
  const flow = useBookingFlow(data, embedded);
  const color = /^#[0-9a-f]{6}$/i.test(data.primaryTextColor)
    ? data.primaryTextColor
    : DEFAULTS.TEXT_COLOR;
  const style = { '--ui-text-primary': color } as CSSProperties;
  return (
    <div className="ice-widget-root ice-booking-page ice-branded-page" style={style}>
      <BrandBackdrop brand={data.brand} />
      <div className="catalog-identity">
        <BookingBrand name={data.organizationName} logoUrl={data.brand.logoUrl} />
        <SocialLinks links={data.socialLinks} />
      </div>
      <div className="ice-cube-shell ice-booking-shell">
        {!flow.details && !flow.form.state?.success ? <BookingHeader data={data} /> : null}
        <BookingFlow flow={flow} />
      </div>
      {!flow.details || flow.form.state?.success ? (
        <ParticipationTerms text={data.terms.fullText} editUrl={data.termsEditUrl} />
      ) : null}
      {data.showPlatformSignature ? <PlatformSignature /> : null}
    </div>
  );
}
