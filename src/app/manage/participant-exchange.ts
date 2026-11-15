import { z } from 'zod';
import { PARTICIPANT, HTTP_STATUS, UI_MESSAGES } from '../../config/constants';
const ExchangeResponse = z.object({ success: z.literal(true), bookingId: z.uuid() });
export async function exchangeParticipantCode(code: string) {
  const response = await fetch('/api/participant/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (
    [HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNAUTHORIZED].some((status) => status === response.status)
  )
    return null;
  if (!response.ok) throw new Error(UI_MESSAGES.UNAVAILABLE);
  const parsed = ExchangeResponse.safeParse(await response.json());
  if (!parsed.success) throw new Error(UI_MESSAGES.UNAVAILABLE);
  return {
    token: PARTICIPANT.MANAGE_PREFIX + parsed.data.bookingId,
    path: `/manage?reservation=${encodeURIComponent(parsed.data.bookingId)}`,
  };
}
