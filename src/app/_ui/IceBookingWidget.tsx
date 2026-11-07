'use client';
import { VoucherField } from './VoucherField';
import type { CSSProperties } from 'react';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { AUDIENCE_POLICIES, DEFAULTS, FORM_LABELS } from '../../config/constants';
import { useBookingForm } from './use-booking-form';
import { BookingSlots } from './BookingSlots';
import { BookingFields } from './BookingFields';
import { BookingTerms } from './BookingTerms';
import { BookingHeader } from './BookingHeader';
import { BookingResult } from './BookingResult';
export function IceBookingWidget({ data }: { readonly data: BookingPageData }) {
  const form = useBookingForm(data);
  const color = /^#[0-9a-f]{6}$/i.test(data.primaryTextColor)
    ? data.primaryTextColor
    : DEFAULTS.TEXT_COLOR;
  const style = { '--ui-text-primary': color } as CSSProperties;
  return (
    <div className="ice-widget-root" style={style}>
      <form className="ice-cube-shell ice-form" onSubmit={form.submit} aria-busy={form.pending}>
        <BookingHeader data={data} />
        <BookingSlots
          slots={data.slots}
          timezone={data.timezone}
          selected={form.selectedIso}
          onSelect={form.setSelected}
        />
        <BookingFields
          requirePhone={data.requirePhone || data.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY}
        />
        <VoucherField
          organizationId={data.organizationId}
          activityId={data.activityId}
          currency={data.currency}
        />
        <BookingTerms terms={data.terms} />
        <button
          className="liquid-ice-button"
          type="submit"
          disabled={form.pending || !form.selectedIso || form.state?.success}
        >
          {form.pending ? FORM_LABELS.SUBMITTING : FORM_LABELS.BOOK}
        </button>
        <BookingResult state={form.state} />
      </form>
    </div>
  );
}
