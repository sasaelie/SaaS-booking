import { boundedForm } from '../../../lib/http-body';
import { HTTP_LIMITS } from '../../../config/constants';
import { HTTP_STATUS } from '../../../config/constants';
import { runtime } from '../../../composition/runtime';
import { administration } from '../../../composition/administration';
import { PAYMENT_RULES } from '../../../config/constants';
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const parsed = await boundedForm(
    request,
    PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES + HTTP_LIMITS.MULTIPART_OVERHEAD_BYTES,
  );
  if (!parsed.ok) return new Response(null, { status: HTTP_STATUS.TOO_LARGE });
  const form = parsed.value;
  const file = form?.get('proof');
  const token = form?.get('token');
  if (
    !(file instanceof File) ||
    typeof token !== 'string' ||
    file.size > PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES
  )
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const limited = await app.value.limiter.accept(
    `proof:${request.headers.get('x-forwarded-for') ?? 'local'}`,
  );
  if (!limited.ok) return Response.json({ success: false }, { status: HTTP_STATUS.RATE_LIMITED });
  const result = await administration(app.value, '').bank.submitProof({
    token,
    fileBytes: new Uint8Array(await file.arrayBuffer()),
  });
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
