'use client';
import { useEffect, useState } from 'react';
import {
  SelfBookingContextSchema,
  type SelfBookingContext,
} from '../../core/validation/self-booking';
export function useBookingContext(token: string) {
  const [context, setContext] = useState<SelfBookingContext | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void fetch('/api/self-service/context', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const result: unknown = await response.json();
        const parsed = SelfBookingContextSchema.safeParse(
          result && typeof result === 'object' && 'data' in result ? result.data : null,
        );
        if (!controller.signal.aborted) {
          setContext(parsed.success ? parsed.data : null);
          setInvalid(!parsed.success);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setInvalid(true);
      });
    return () => controller.abort();
  }, [token, version]);
  return { context, invalid, refresh: () => setVersion((value) => value + 1) };
}
