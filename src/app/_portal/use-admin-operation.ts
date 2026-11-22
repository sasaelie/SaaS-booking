'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PORTAL } from '../../config/constants';
import { SESSION_UI } from '../../config/session-details';
import { adminRequest } from './portal-request';
import { useMutation } from './use-mutation';
function useConfirmation() {
  const [confirmation, setConfirmation] = useState<{ hash: string; count: number } | null>(null);
  const [accepted, setAccepted] = useState(false);
  function invalidate() {
    setConfirmation(null);
    setAccepted(false);
  }
  return { confirmation, setConfirmation, accepted, setAccepted, invalidate };
}
export function useAdminOperation(command: Readonly<Record<string, unknown>>) {
  const state = useMutation();
  const confirmation = useConfirmation();
  const [proof, setProof] = useState('');
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    return state.run(async () => {
      const result = await adminRequest(managementCommand(command, form, confirmation));
      if ('error' in result) {
        state.setMessage(result.error ?? PORTAL.ERROR);
        return;
      }
      const data = result.data;
      if (
        data?.status === 'CONFIRMATION_REQUIRED' &&
        data.confirmationHash &&
        data.affectedBookingsCount !== undefined
      ) {
        confirmation.setConfirmation({
          hash: data.confirmationHash,
          count: data.affectedBookingsCount,
        });
        confirmation.setAccepted(false);
        return;
      }
      if (data?.presignedUrl) setProof(data.presignedUrl);
      navigateToEditedSession(command, data?.sessionStartsAt, router);
      state.setMessage(
        data?.status === 'CLOSED_AND_REFUNDS_QUEUED'
          ? SESSION_UI.MAIL_PENDING
          : PORTAL.MANAGEMENT_DONE,
      );
      confirmation.invalidate();
      router.refresh();
    });
  }
  return { pending: state.pending, message: state.message, proof, ...confirmation, submit };
}

function managementCommand(
  command: Readonly<Record<string, unknown>>,
  form: FormData,
  confirmation: ReturnType<typeof useConfirmation>,
) {
  return {
    ...command,
    ...Object.fromEntries(form),
    reason: String(form.get('reason') ?? ''),
    adminOverride: form.has('adminOverride'),
    confirmCancelExistingBookings: Boolean(confirmation.confirmation && confirmation.accepted),
    confirmationHash: confirmation.confirmation?.hash,
  };
}

function navigateToEditedSession(
  command: Readonly<Record<string, unknown>>,
  startsAt: string | undefined,
  router: ReturnType<typeof useRouter>,
) {
  if (
    startsAt &&
    typeof command['organizationId'] === 'string' &&
    typeof command['activityId'] === 'string'
  )
    router.replace(
      `/app/${encodeURIComponent(command['organizationId'])}/seances/${encodeURIComponent(command['activityId'])}?startsAt=${encodeURIComponent(startsAt)}`,
    );
}
