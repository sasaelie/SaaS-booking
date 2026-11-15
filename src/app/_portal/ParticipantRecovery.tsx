'use client';
import { useState } from 'react';
import { PARTICIPANT_UI as UI } from '../../config/constants';
export function ParticipantRecovery({
  organizationId,
  bookingId,
}: {
  readonly organizationId: string;
  readonly bookingId: string;
}) {
  const { code, pending, failed, recover } = useParticipantRecovery(organizationId, bookingId);
  return (
    <section className="portal-panel">
      <h3>{UI.TICKET}</h3>
      {code ? (
        <>
          <label className="ticket-code">
            {UI.CODE}
            <textarea value={code} readOnly />
          </label>
          <a
            href={`/manage#code=${encodeURIComponent(code)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {UI.LOGIN}
          </a>
        </>
      ) : (
        <button
          type="button"
          className="liquid-ice-button portal-button"
          onClick={() => void recover()}
          disabled={pending}
        >
          {pending ? UI.LOADING : UI.RECOVER}
        </button>
      )}
      {failed ? <p role="alert">{UI.RECOVERY_FAILED}</p> : null}
    </section>
  );
}

function useParticipantRecovery(organizationId: string, bookingId: string) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function recover() {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch('/api/participant/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, bookingId }),
      });
      const data: unknown = await response.json();
      if (
        response.ok &&
        data &&
        typeof data === 'object' &&
        'code' in data &&
        typeof data.code === 'string'
      )
        setCode(data.code);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }
  return { code, pending, failed, recover };
}
