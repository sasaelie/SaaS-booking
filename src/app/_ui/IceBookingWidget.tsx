'use client';
import type { CSSProperties } from 'react';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { DEFAULTS } from '../../config/constants';
import { BookingBrand } from './BookingBrand';
import { BookingHeader } from './BookingHeader';
import { BookingFlow } from './BookingFlow';
export function IceBookingWidget({ data }: { readonly data: BookingPageData }) {
  const color = /^#[0-9a-f]{6}$/i.test(data.primaryTextColor)
    ? data.primaryTextColor
    : DEFAULTS.TEXT_COLOR;
  const style = { '--ui-text-primary': color } as CSSProperties;
  return (
    <div className="ice-widget-root ice-booking-page" style={style}>
      <BookingBrand name={data.organizationName} />
      <div className="ice-cube-shell ice-booking-shell">
        <BookingHeader data={data} />
        <BookingFlow data={data} />
      </div>
    </div>
  );
}
