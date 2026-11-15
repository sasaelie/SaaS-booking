'use client';
import { useEffect, useRef, useState } from 'react';
import { PARTICIPANT } from '../../config/constants';
import { exchangeParticipantCode } from './participant-exchange';
type Exchange = { code: string; result: ReturnType<typeof exchangeParticipantCode> };
export function useManagementToken(
  setToken: (token: string | null) => void,
  setMessage: (message: string) => void,
  simulationId?: string,
) {
  const originalCode = useRef('');
  const exchange = useRef<Exchange | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    const read = () => {
      void managementLink(originalCode, exchange, simulationId).then((result) => {
        if (disposed) return;
        if (result.path) window.history.replaceState(window.history.state, '', result.path);
        setToken(result.token);
        setUnavailable(result.token === null);
        setMessage('');
      });
    };
    read();
    window.addEventListener('hashchange', read);
    return () => {
      disposed = true;
      window.removeEventListener('hashchange', read);
    };
  }, [setToken, setMessage, simulationId, attempt]);
  return {
    unavailable,
    refresh: () => {
      exchange.current = null;
      setAttempt((value) => value + 1);
    },
  };
}
async function managementLink(
  original: { current: string },
  cached: { current: Exchange | null },
  simulationId?: string,
) {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const legacy = fragment.get('token');
  if (legacy) return { token: legacy, path: null };
  const code = fragment.get('code') ?? original.current;
  if (!code) {
    const booking = new URLSearchParams(window.location.search).get('reservation');
    return { token: booking ? PARTICIPANT.MANAGE_PREFIX + booking : '', path: null };
  }
  original.current = code;
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  );
  if (simulationId) return { token: code, path: null };
  try {
    if (cached.current?.code !== code)
      cached.current = { code, result: exchangeParticipantCode(code) };
    return (await cached.current.result) ?? { token: '', path: null };
  } catch {
    cached.current = null;
    return { token: null, path: null };
  }
}
