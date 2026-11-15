'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PORTAL, SETTINGS_UI, PAYMENT_RULES } from '../../config/constants';
import { portalError, PortalResponseSchema } from './portal-response';
import { useMutation } from './use-mutation';
export function useMediaUpload(organizationId: string, kind: string) {
  const state = useMutation();
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [present, setPresent] = useState<boolean | null>(null);
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
      setPresent(method === 'POST');
      setRevision((value) => value + 1);
      router.refresh();
    });
  }
  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get('image');
    if (!(file instanceof File) || file.size === 0) return;
    if (!validFileSize(file, state.setMessage)) return;
    void request('POST', file);
  }
  return {
    pending: state.pending,
    message: state.message,
    revision,
    present,
    upload,
    remove: () => request('DELETE'),
  };
}

function validFileSize(file: File, message: (value: string) => void) {
  if (file.size <= PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES) return true;
  message(SETTINGS_UI.MEDIA_HINT);
  return false;
}
