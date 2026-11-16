'use client';
import { simulationApi } from '../../config/simulation';
import { SERVICE } from '../../config/service';
import { formatMoney } from './format-money';
import { useState, useRef, useEffect } from 'react';
import { BOOKING_UI, PARTICIPANT_UI } from '../../config/constants';
interface QuoteContext {
  readonly simulationId?: string;
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
type Quote = { amount: number; remainder: number } | { multiple: true };
async function fetchQuote(context: QuoteContext, code: string): Promise<Quote | null> {
  const response = await fetch(
    context.simulationId ? simulationApi(context.simulationId, 'quote') : '/api/voucher-quote',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: context.organizationId,
        activityId: context.activityId,
        code,
      }),
    },
  );
  const body: unknown = await response.json();
  if (body && typeof body === 'object' && 'code' in body && body.code === 'CONFLICT')
    return { multiple: true };
  const payload = body && typeof body === 'object' && 'data' in body ? body.data : body;
  const amount = amountFrom(payload);
  if (!response.ok || amount === null) return null;
  const remainder =
    typeof payload === 'object' &&
    payload !== null &&
    'remainderValueCents' in payload &&
    typeof payload.remainderValueCents === 'number'
      ? payload.remainderValueCents
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
      state.setRemaining(amount && 'amount' in amount ? amount.amount : null);
      state.setMessage(quoteMessage(amount, state.context.currency));
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

function quoteMessage(quote: Quote | null, currency: string) {
  if (!quote) return BOOKING_UI.VOUCHER_INVALID;
  if ('multiple' in quote) return PARTICIPANT_UI.MULTIPLE;
  return `${BOOKING_UI.VOUCHER_SUCCESS}${quote.remainder > 0 ? ` ${SERVICE.REMAINDER} ${formatMoney(quote.remainder, currency)}` : ''}`;
}
