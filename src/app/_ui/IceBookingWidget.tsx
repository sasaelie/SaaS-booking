// src/app/_ui/IceBookingWidget.tsx
'use client';
import React, { useState } from 'react';
import { AUDIENCE_POLICIES, type AudiencePolicy } from '../../config/constants';
export interface UiSlotItem {
  readonly startsAtIso: string;
  readonly timeRangeLabel: string;
  readonly availabilityLabel: string;
  readonly isBookable: boolean;
}
export interface IceBookingWidgetProps {
  readonly organizationName: string;
  readonly activityName: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly audiencePolicy: AudiencePolicy;
  readonly ageAttestationLabel: string;
  readonly primaryTextColor?: string;
  readonly slots: readonly UiSlotItem[];
  readonly appliedVoucherDiscountCents?: number;
  readonly onSubmitBooking: (payload: {
    readonly startsAtIso: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string;
    readonly voucherCode: string;
    readonly acceptedTerms: boolean;
    readonly acceptedAgeAttestation: boolean;
  }) => Promise<void>;
}
function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}
export function IceBookingWidget(
  props: IceBookingWidgetProps,
): React.JSX.Element {
  const firstBookable =
    props.slots.find((s) => s.isBookable)?.startsAtIso ?? '';
  const [selectedIso, setSelectedIso] = useState<string>(firstBookable);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedAge, setAcceptedAge] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const discount = props.appliedVoucherDiscountCents ?? 0;
  const remainingCents = Math.max(0, props.priceCents - discount);
  const isPhoneMandatory =
    props.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY;
  const customStyle = {
    '--ui-text-primary': props.primaryTextColor ?? '#143D2B',
  } as React.CSSProperties;
  async function handleFormSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    if (!selectedIso || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await props.onSubmitBooking({
        startsAtIso: selectedIso,
        firstName,
        lastName,
        email,
        phone,
        voucherCode,
        acceptedTerms,
        acceptedAgeAttestation: acceptedAge,
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="ice-widget-root max-w-md mx-auto" style={customStyle}>
      <form onSubmit={handleFormSubmit} className="ice-cube-shell space-y-4">
        <header className="flex items-baseline justify-between px-2 pt-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
              {props.organizationName}
            </p>
            <h2 className="text-xl font-bold tracking-tight">
              {props.activityName}
            </h2>
          </div>
          <span className="text-lg font-extrabold">
            {formatEuros(props.priceCents)}
          </span>
        </header>
        <section className="space-y-2" aria-label="Créneaux disponibles">
          {props.slots.map((slot) => {
            const isSelected = slot.startsAtIso === selectedIso;
            return (
              <button
                key={slot.startsAtIso}
                type="button"
                disabled={!slot.isBookable}
                data-selected={isSelected}
                onClick={() => setSelectedIso(slot.startsAtIso)}
                className="ice-slot-pebble w-full px-4 flex items-center justify-between text-left disabled:opacity-45"
              >
                <span className="font-semibold">{slot.timeRangeLabel}</span>
                <span className="text-sm font-bold">
                  {slot.availabilityLabel} places
                </span>
              </button>
            );
          })}
        </section>
        <section className="grid grid-cols-2 gap-2 pt-1">
          <input
            type="text"
            required
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="ice-slot-pebble px-3 text-sm font-medium outline-none"
          />
          <input
            type="text"
            required
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="ice-slot-pebble px-3 text-sm font-medium outline-none"
          />
        </section>
        <input
          type="email"
          required
          placeholder="Adresse e-mail (confirmation & QR Code)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="ice-slot-pebble w-full px-3 text-sm font-medium outline-none"
        />
        <input
          type="tel"
          required={isPhoneMandatory}
          placeholder={
            isPhoneMandatory
              ? 'Téléphone d’urgence du parent (Obligatoire)'
              : 'Téléphone (Optionnel)'
          }
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="ice-slot-pebble w-full px-3 text-sm font-medium outline-none"
        />
        <input
          type="text"
          placeholder="Code de report (ex: RPT-8K4M-92LP)"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          className="ice-slot-pebble w-full px-3 text-sm font-medium outline-none"
        />
        <div className="space-y-2 px-1 text-xs leading-snug">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={acceptedAge}
              onChange={(e) => setAcceptedAge(e.target.checked)}
              className="mt-0.5"
            />
            <span>{props.ageAttestationLabel}</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              J’accepte les conditions (aucun remboursement client, report si
              prévenu 72h à l’avance, art. VI.53, 12° CDE).
            </span>
          </label>
        </div>
        <button
          type="submit"
          disabled={!selectedIso || isSubmitting}
          className="liquid-ice-button w-full px-6 text-base flex items-center justify-center"
        >
          {remainingCents === 0
            ? 'Confirmer gratuitement avec mon code (0,00 €)'
            : `Réserver 1 place • ${formatEuros(remainingCents)}`}
        </button>
      </form>
    </div>
  );
}
