'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { FORM_LABELS } from '../../config/constants';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { EmbeddedSiteReturn } from './BookingResultActions';
const ManageBooking = dynamic(() => import('../manage/ManageBooking').then((m) => m.ManageBooking));
export function EmbeddedBookingManagement({
  token,
  simulationId,
  onBack,
}: {
  readonly token: string;
  readonly simulationId?: string;
  readonly onBack: (booking: SelfBookingContext | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      className="ice-result"
      data-success="true"
      aria-label={FORM_LABELS.MANAGE}
    >
      <ManageBooking simulationId={simulationId} inline={{ token, onBack }} />
      <EmbeddedSiteReturn />
    </div>
  );
}
