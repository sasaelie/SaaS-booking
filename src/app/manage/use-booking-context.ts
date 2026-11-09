'use client';
import { useEffect, useState } from 'react';
import {
  SelfBookingContextSchema,
  type SelfBookingContext,
} from '../../core/validation/self-booking';
import { HTTP_STATUS } from '../../config/constants';
type ContextState = { context: SelfBookingContext | null; error: 'invalid' | 'unavailable' | null };
const empty: ContextState = { context: null, error: null };
export function useBookingContext(token: string | null) {
  const [state, setState] = useState<ContextState>(empty);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (token === null) return;
    setState(empty);
    if (!token) {
      setState({ context: null, error: 'invalid' });
      return;
    }
    const controller = new AbortController();
    void readContext(token, controller.signal).then((result) => {
      if (!controller.signal.aborted) setState(result);
    });
    return () => controller.abort();
  }, [token, version]);
  return {
    context: state.context,
    invalid: state.error === 'invalid',
    unavailable: state.error === 'unavailable',
    refresh: () => setVersion((value) => value + 1),
  };
}
async function readContext(token: string, signal: AbortSignal): Promise<ContextState> {
  try {
    const response = await fetch('/api/self-service/context', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (response.status === HTTP_STATUS.BAD_REQUEST || response.status === HTTP_STATUS.UNAUTHORIZED)
      return { context: null, error: 'invalid' };
    const raw: unknown = await response.json();
    const parsed = SelfBookingContextSchema.safeParse(
      raw && typeof raw === 'object' && 'data' in raw ? raw.data : null,
    );
    return response.ok && parsed.success
      ? { context: parsed.data, error: null }
      : { context: null, error: 'unavailable' };
  } catch {
    return { context: null, error: 'unavailable' };
  }
}
