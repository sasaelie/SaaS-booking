'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SIMULATION, simulationApi, simulationPath } from '../../config/simulation';
import Link from 'next/link';
export function SimulationPayment({ id, bookingId }: { readonly id: string; readonly bookingId: string }) {
  const { pending, message, pay } = useSimulationPayment(id, bookingId);
  return (
    <section className="portal-panel">
      <h1>{SIMULATION.PAYMENT}</h1>
      <p>{SIMULATION.PAYMENT_NOTICE}</p>
      <div className="appearance-actions">
        <button className="liquid-ice-button" disabled={pending} onClick={() => pay(true)}>
          {SIMULATION.PAY}
        </button>
        <button className="portal-secondary-action" disabled={pending} onClick={() => pay(false)}>
          {SIMULATION.FAIL}
        </button>
      </div>
      <p role="status">{message}</p>
      <Link className="portal-secondary-action" href={`${simulationPath(id)}/reservations`}>
        {SIMULATION.RETURN}
      </Link>
    </section>
  );
}

function useSimulationPayment(id: string, bookingId: string) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function pay(success: boolean) {
    setPending(true);
    try {
      const result = await fetch(simulationApi(id, 'payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, success }),
      });
      if (result.ok && success) router.push(`${simulationPath(id)}/reservations`);
      else setMessage(SIMULATION.FAILED);
    } catch {
      setMessage(SIMULATION.FAILED);
    } finally {
      setPending(false);
    }
  }

  return { pending, message, pay };
}
