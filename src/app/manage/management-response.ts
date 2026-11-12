import { FORM_LABELS, UI_MESSAGES, HTTP_STATUS } from '../../config/constants';
export async function sendOperation(form: FormData, token: string, upload: boolean, endpoint?: string) {
  const response = await fetch(endpoint ?? (upload ? '/api/bank-proof' : '/api/self-service'), {
    method: 'POST',
    headers: upload ? undefined : { 'Content-Type': 'application/json' },
    body: upload ? form : JSON.stringify({ token }),
  });
  const body: unknown = await response.json().catch(() => null);
  const ok = response.ok && body !== null && typeof body === 'object' && 'success' in body && body.success === true;
  return {
    ok,
    message: ok
      ? upload
        ? FORM_LABELS.PROOF_RECEIVED
        : UI_MESSAGES.CANCEL_SUCCESS
      : operationError(body, response.status),
  };
}
function operationError(body: unknown, status: number): string {
  const code = body && typeof body === 'object' && 'code' in body ? body.code : '';
  if (status === HTTP_STATUS.TOO_LARGE || code === 'INVALID_PROOF_FILE') return FORM_LABELS.PROOF_INVALID;
  if (code === 'UNAUTHORIZED') return FORM_LABELS.LINK_INVALID;
  if (code === 'CONFIGURATION_ERROR') return FORM_LABELS.STORAGE_UNAVAILABLE;
  return UI_MESSAGES.FAILURE;
}
