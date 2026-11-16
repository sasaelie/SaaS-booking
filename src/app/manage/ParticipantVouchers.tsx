import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI, DEFAULTS } from '../../config/constants';
import { CODE_STATES } from '../../config/service';
import { formatMoney } from '../../lib/format-money';
import { simulationPath } from '../../config/simulation';
export function ParticipantVouchers({
  booking,
  simulationId,
  testParticipant = false,
}: {
  readonly booking: SelfBookingContext;
  readonly simulationId?: string;
  readonly testParticipant?: boolean;
}) {
  if (!booking.ticket?.vouchers.length) return null;
  const base = simulationId
    ? simulationPath(simulationId) + '/activite'
    : `/${booking.organizationSlug}`;
  return (
    <section>
      <h2>{UI.VOUCHERS}</h2>
      <ul className="ticket-vouchers">
        {booking.ticket.vouchers.map((voucher) => (
          <li key={voucher.id}>
            <strong>{formatMoney(voucher.valueCents, voucher.currency)}</strong>
            <span>{CODE_STATES[voucher.status] ?? voucher.status}</span>
            <span>
              {new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
                timeZone: booking.timezone,
                dateStyle: 'long',
              }).format(new Date(voucher.expiresAtIso))}
            </span>
            <code>{voucher.code}</code>
            {voucher.status === 'ACTIVE' && !testParticipant ? (
              <a href={`${base}/${booking.activityId}#voucher=${encodeURIComponent(voucher.code)}`}>
                {UI.USE}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
