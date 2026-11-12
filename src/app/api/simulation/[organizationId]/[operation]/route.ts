import { simulation } from '../../../../../composition/simulation';
import { boundedJson } from '../../../../../lib/http-body';
import { HTTP_STATUS } from '../../../../../config/constants';
import { SimulationDeleteSchema, SimulationPaymentSchema } from '../../../../../core/validation/simulation';
import { z } from 'zod';
export async function POST(
  request: Request,
  { params }: { readonly params: Promise<{ organizationId: string; operation: string }> },
) {
  const { organizationId, operation } = await params;
  const app = await simulation(request.headers, organizationId);
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const body = await boundedJson(request);
  if (!body.ok) return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await operationResult(app.value, organizationId, operation, body.value);
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  );
}
async function operationResult(
  app: Extract<Awaited<ReturnType<typeof simulation>>, { ok: true }>['value'],
  id: string,
  operation: string,
  body: unknown,
) {
  if (operation === 'payment' && SimulationPaymentSchema.safeParse(body).success) return app.tests.payment(body);
  if (operation === 'delete' && SimulationDeleteSchema.safeParse(body).success) return app.tests.delete(body);
  if (
    operation === 'quote' &&
    body &&
    typeof body === 'object' &&
    'organizationId' in body &&
    body.organizationId === id
  )
    return app.quote.execute(body);
  const parsed = z.object({ token: z.string().min(1) }).safeParse(body);
  if (parsed.success && (operation === 'context' || operation === 'cancel')) {
    const token = await app.verify(parsed.data.token);
    if (!token.ok) return token;
    const exists = await app.repository.visible(token.value.bookingId);
    if (!exists.ok) return exists;
    return operation === 'context'
      ? app.selfBooking.execute(parsed.data.token)
      : app.cancellation.cancelByAttendee(parsed.data);
  }
  return { ok: false as const, error: { code: 'VALIDATION_FAILED' as const } };
}
