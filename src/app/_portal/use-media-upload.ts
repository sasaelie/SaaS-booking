'use client';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PORTAL, SETTINGS_UI, PAYMENT_RULES } from '../../config/constants';
import { portalError, PortalResponseSchema } from './portal-response';
import { useMutation } from './use-mutation';
export function useMediaUpload(organizationId: string, kind: string) {
  const state = useMutation();
  const router = useRouter();
  function request(method: 'POST' | 'DELETE', file?: File) {
    return state.run(async () => {
      const response = await fetch(
        `/api/portal/media?${new URLSearchParams({ organizationId, kind })}`,
        { method, body: file },
      );
      const raw: unknown = await response.json();
      const parsed = PortalResponseSchema.safeParse(raw);
      if (!parsed.success || !parsed.data.success) {
        state.setMessage(portalError(parsed.success ? parsed.data.code : undefined));
        return;
      }
      state.setMessage(PORTAL.SUCCESS);
      router.refresh();
    });
  }
  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get('image');
    if (!(file instanceof File) || file.size === 0) return;
    if (file.size > PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES) {
      state.setMessage(SETTINGS_UI.MEDIA_HINT);
      return;
    }
    void request('POST', file);
  }
  return {
    pending: state.pending,
    message: state.message,
    upload,
    remove: () => request('DELETE'),
  };
}
