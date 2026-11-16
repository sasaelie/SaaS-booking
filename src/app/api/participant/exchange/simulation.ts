import { SimulationParticipantExchangeSchema } from '../../../../core/validation/simulation-participant';
import { simulationParticipantLogin } from '../../../../composition/simulation-participant-login';
import { HTTP_STATUS, ERROR_CODES } from '../../../../config/constants';
export async function simulationExchange(raw: unknown) {
  const parsed = SimulationParticipantExchangeSchema.safeParse(raw);
  if (!parsed.success) return null;
  const app = simulationParticipantLogin();
  const result = app.ok ? await app.value.execute(parsed.data) : app;
  const unavailable =
    !result.ok &&
    [ERROR_CODES.INTERNAL_ERROR, ERROR_CODES.CONFIGURATION_ERROR].some(
      (code) => code === result.error.code,
    );
  return Response.json(
    result.ok ? { success: true, simulation: result.value } : { success: false },
    {
      status: result.ok
        ? HTTP_STATUS.OK
        : unavailable
          ? HTTP_STATUS.UNAVAILABLE
          : HTTP_STATUS.UNAUTHORIZED,
      headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
    },
  );
}
