import { ERROR_CODES, HTTP_LIMITS } from '../config/constants';
import { failure } from './errors';
import { ok, type Result } from './result';
export async function boundedBody(
  request: Request,
  maximum: number,
): Promise<Result<Uint8Array<ArrayBuffer>>> {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > maximum)
      return failure(ERROR_CODES.VALIDATION_FAILED, 'Http', 'bodyLimit');
    const reader = request.body?.getReader();
    if (!reader) return ok(new Uint8Array());
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.length;
      if (length > maximum) {
        await reader.cancel();
        return failure(ERROR_CODES.VALIDATION_FAILED, 'Http', 'bodyLimit');
      }
      chunks.push(next.value);
    }
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return ok(output);
  } catch {
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Http', 'readBody');
  }
}
export async function boundedJson(request: Request): Promise<Result<unknown>> {
  const body = await boundedBody(request, HTTP_LIMITS.JSON_BYTES);
  if (!body.ok) return body;
  try {
    return ok(JSON.parse(new TextDecoder().decode(body.value)));
  } catch {
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Http', 'json');
  }
}
export async function boundedForm(request: Request, maximum: number): Promise<Result<FormData>> {
  const body = await boundedBody(request, maximum);
  if (!body.ok) return body;
  try {
    return ok(await new Response(body.value, { headers: request.headers }).formData());
  } catch {
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Http', 'multipart');
  }
}
