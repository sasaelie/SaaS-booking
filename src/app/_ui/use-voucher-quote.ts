'use client';
import { SERVICE } from '../../config/service';
import { formatMoney } from './format-money';
import { useState, useRef, useEffect } from 'react';
import { BOOKING_UI } from '../../config/constants';
interface QuoteContext {
  readonly organizationId: string;
  readonly activityId: string;
  readonly priceCents: number;
  readonly currency: string;
}
function amountFrom(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('remainingToPayCents' in value)) return null;
  const amount = value.remainingToPayCents;
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}
async function fetchQuote(
  context: QuoteContext,
  code: string,
): Promise<{ amount: number; remainder: number } | null> {
  const response = await fetch('/api/voucher-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: context.organizationId,
      activityId: context.activityId,
      code,
    }),
  });
  const body: unknown = await response.json();
  const amount = amountFrom(body);
  if (!response.ok || amount === null) return null;
  const remainder =
    typeof body === 'object' &&
    body !== null &&
    'remainderValueCents' in body &&
    typeof body.remainderValueCents === 'number'
      ? body.remainderValueCents
      : 0;
  return { amount, remainder };
}
export function useVoucherQuote(context: QuoteContext) {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    request.current++;
    setRemaining(null);
    setMessage('');
    setPending(false);
  }, [context.organizationId, context.activityId, context.priceCents]);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('voucher');
    if (value) {
      const code = value.toUpperCase();
      setCode(code);
      void quoteActions({ context, code, request, setRemaining, setMessage, setPending })();
    }
  }, [context.organizationId, context.activityId, context.priceCents, context.currency]);
  function change(value: string) {
    request.current++;
    setCode(value.toUpperCase());
    setRemaining(null);
    setMessage('');
    setPending(false);
  }
  const actions = quoteActions({ context, code, request, setRemaining, setMessage, setPending });
  return { code, remaining, message, pending, change, verify: actions };
}
interface QuoteActions {
  readonly context: QuoteContext;
  readonly code: string;
  readonly request: { current: number };
  readonly setRemaining: (value: number | null) => void;
  readonly setMessage: (value: string) => void;
  readonly setPending: (value: boolean) => void;
}
function quoteActions(state: QuoteActions) {
  return async function verify(): Promise<void> {
    const sequence = ++state.request.current;
    if (!state.code.trim()) {
      state.setRemaining(null);
      state.setMessage('');
      return;
    }
    state.setPending(true);
    try {
      const amount = await fetchQuote(state.context, state.code.trim());
      if (sequence !== state.request.current) return;
      state.setRemaining(amount?.amount ?? null);
      state.setMessage(
        amount !== null
          ? `${BOOKING_UI.VOUCHER_SUCCESS}${amount.remainder > 0 ? ` ${SERVICE.REMAINDER} ${formatMoney(amount.remainder, state.context.currency)}` : ''}`
          : BOOKING_UI.VOUCHER_INVALID,
      );
    } catch {
      if (sequence === state.request.current) {
        state.setRemaining(null);
        state.setMessage(BOOKING_UI.VOUCHER_UNAVAILABLE);
      }
    } finally {
      if (sequence === state.request.current) state.setPending(false);
    }
  };
}
