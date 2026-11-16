import { z } from 'zod';
import { PARTICIPANT, HTTP_STATUS, UI_MESSAGES } from '../../config/constants';
import { SimulationParticipantTargetSchema } from '../../core/validation/simulation-participant';
const ExchangeResponse = z.union([
  z.object({ success: z.literal(true), bookingId: z.uuid() }),
  z.object({ success: z.literal(true), simulation: SimulationParticipantTargetSchema }),
]);
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
  if ('simulation' in parsed.data) {
    const target = parsed.data.simulation;
    return {
      token: target.token,
      path: `${PARTICIPANT.TEST_PATH}#token=${encodeURIComponent(target.token)}`,
    };
  }
  return {
    token: PARTICIPANT.MANAGE_PREFIX + parsed.data.bookingId,
    path: `/manage?reservation=${encodeURIComponent(parsed.data.bookingId)}`,
  };
}
