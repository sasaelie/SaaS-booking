'use client';
import { useState, useRef, useEffect } from 'react';
interface QuoteContext {
  readonly organizationId: string;
  readonly activityId: string;
}
function amountFrom(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('remainingToPayCents' in value)) return null;
  const amount = value.remainingToPayCents;
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}
async function fetchQuote(context: QuoteContext, code: string): Promise<number | null> {
  const response = await fetch('/api/voucher-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...context, code }),
  });
  const body: unknown = await response.json();
  return response.ok ? amountFrom(body) : null;
}
export function useVoucherQuote(context: QuoteContext) {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('voucher');
    if (value) setCode(value);
  }, []);
  function change(value: string) {
    request.current++;
    setCode(value.toUpperCase());
    setRemaining(null);
    setMessage('');
  }
  async function verify(): Promise<void> {
    const sequence = ++request.current;
    if (!code.trim()) {
      setRemaining(null);
      return;
    }
    try {
      const amount = await fetchQuote(context, code);
      if (sequence === request.current) {
        setRemaining(amount);
        setMessage(amount !== null ? 'Montant restant à payer' : 'Code indisponible ou expiré.');
      }
    } catch {
      if (sequence === request.current) {
        setRemaining(null);
        setMessage('Vérification indisponible.');
      }
    }
  }
  return { code, remaining, message, change, verify };
}
