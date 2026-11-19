'use client';
import { simulationApi } from '../../config/simulation';
import { useState, type FormEvent } from 'react';
import { UI_MESSAGES, PARTICIPANT } from '../../config/constants';
import { sendOperation } from './management-response';
import { useBookingContext } from './use-booking-context';
import { useManagementToken } from './use-management-token';
export function useManagement(
  simulationId?: string,
  testParticipant = false,
  initialToken?: string,
) {
  const [token, setToken] = useState<string | null>(initialToken ?? null);
  const [message, setMessage] = useState('');
  const details = useBookingContext(
    token,
    testParticipant
      ? `${PARTICIPANT.TEST_API}/context`
      : simulationId
        ? simulationApi(simulationId, 'context')
        : undefined,
  );
  const link = useManagementToken(setToken, setMessage, simulationId, initialToken);
  const endpoint = testParticipant
    ? `${PARTICIPANT.TEST_API}/cancel`
    : simulationId
      ? simulationApi(simulationId, 'cancel')
      : undefined;
  const actions = useManagementActions(token, endpoint, setMessage, details.refresh);

  return {
    token,
    message,
    ...actions,
    ...details,
    unavailable: details.unavailable || link.unavailable,
    refresh: link.unavailable ? link.refresh : details.refresh,
    cancelled: message === UI_MESSAGES.CANCEL_SUCCESS,
  };
}

function useManagementActions(
  token: string | null,
  endpoint: string | undefined,
  setMessage: (message: string) => void,
  refresh: () => void,
) {
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, upload: boolean): Promise<void> {
    event.preventDefault();
    if (!token || pending) return;
    const form = new FormData(event.currentTarget);
    form.set('token', token);
    setPending(true);
    try {
      const result = await sendOperation(form, token, upload, endpoint);
      setMessage(result.message);
      if (result.ok) refresh();
    } catch {
      setMessage(UI_MESSAGES.FAILURE);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    cancel: (event: FormEvent<HTMLFormElement>) => submit(event, false),
    upload: (event: FormEvent<HTMLFormElement>) => submit(event, true),
  };
}
