'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SimulationBooking } from '../../core/ports/simulation.port';
import { SIMULATION, simulationPath, simulationApi } from '../../config/simulation';
import { CODE_STATES } from '../../config/service';
import { BOOKING_STATUS_LABELS } from '../../config/constants';
import { formatMoney } from '../_ui/format-money';
export function SimulationBookings({
  id,
  bookings,
}: {
  readonly id: string;
  readonly bookings: readonly SimulationBooking[];
}) {
  return (
    <section>
      <h1>{SIMULATION.LIST}</h1>
      <Link className="portal-secondary-action" href={simulationPath(id)}>
        {SIMULATION.OPEN}
      </Link>
      {!bookings.length ? <p>{SIMULATION.EMPTY}</p> : null}
      <div className="portal-cards">
        {bookings.map((booking) => (
          <SimulationCard key={booking.id} id={id} booking={booking} />
        ))}
      </div>
    </section>
  );
}
function SimulationCard({ id, booking: b }: { readonly id: string; readonly booking: SimulationBooking }) {
  const { pending, error, remove } = useDeleteSimulation(id, b.id);
  const success =
    !b.failure &&
    (b.status === 'CONFIRMED' || b.status.startsWith('CANCELLED')) &&
    (b.amountCents >= b.priceCents || b.priceCents === 0);
  return (
    <article className="portal-panel simulation-card">
      <span className="portal-badge">{SIMULATION.TAG}</span>
      <h2>{b.activityName}</h2>
      <p>
        {b.name} — {b.email}
      </p>
      <p>{new Date(b.startsAt).toLocaleString('fr-BE', { timeZone: b.timezone })}</p>
      <p className="status-badge" data-tone={success ? 'green' : 'orange'}>
        {success ? SIMULATION.SUCCESS : SIMULATION.INCOMPLETE}
      </p>
      <p>
        {BOOKING_STATUS_LABELS[b.status]} · {formatMoney(b.amountCents, b.currency)} {SIMULATION.PAID_SUFFIX}
      </p>
      {b.failure ? <p role="status">{SIMULATION.FAILED}</p> : null}
      <SimulationActions id={id} booking={b} success={success} pending={pending} remove={remove} />
      <SimulationVouchers id={id} booking={b} />
      <details>
        <summary>{SIMULATION.DETAILS}</summary>
        <p>{b.terms}</p>
      </details>
      <p role="alert">{error}</p>
    </article>
  );
}

function useDeleteSimulation(id: string, bookingId: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    setPending(true);
    try {
      const response = await fetch(simulationApi(id, 'delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      if (response.ok) router.refresh();
      else setError(SIMULATION.DELETE_FAILED);
    } catch {
      setError(SIMULATION.DELETE_FAILED);
    } finally {
      setPending(false);
    }
  }

  return { pending, error, remove };
}

function SimulationActions({
  id,
  booking: b,
  success,
  pending,
  remove,
}: {
  readonly id: string;
  readonly booking: SimulationBooking;
  readonly success: boolean;
  readonly pending: boolean;
  readonly remove: () => Promise<void>;
}) {
  return (
    <div className="appearance-actions">
      {!success && !b.status.startsWith('CANCELLED') ? (
        <Link className="portal-secondary-action" href={`${simulationPath(id)}/paiement/${b.id}`}>
          {SIMULATION.PAYMENT}
        </Link>
      ) : null}
      <Link
        className="portal-secondary-action"
        href={`${simulationPath(id)}/gestion#token=${encodeURIComponent(b.managementToken)}`}
      >
        {SIMULATION.MANAGE}
      </Link>
      <button className="portal-secondary-action" onClick={remove} disabled={pending}>
        {SIMULATION.DELETE}
      </button>
    </div>
  );
}

function SimulationVouchers({ id, booking: b }: { readonly id: string; readonly booking: SimulationBooking }) {
  return (
    <>
      {b.vouchers.map((v) => (
        <div className="portal-notice" key={v.code}>
          <strong>
            {SIMULATION.VOUCHER} {v.code}
          </strong>
          <p>
            {formatMoney(v.amountCents, b.currency)} · {CODE_STATES[v.status] ?? v.status} · {SIMULATION.UNTIL}{' '}
            {new Date(v.expiresAt).toLocaleDateString('fr-BE')}
          </p>
          {v.status === 'ACTIVE' ? (
            <Link
              className="portal-secondary-action"
              href={`${simulationPath(id)}/activite/${b.activityId}#voucher=${encodeURIComponent(v.code)}`}
            >
              {SIMULATION.REUSE}
            </Link>
          ) : null}
        </div>
      ))}
    </>
  );
}
