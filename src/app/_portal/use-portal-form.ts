'use client';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { formCommand, type PortalAction } from './form-command';
import { portalRequest } from './portal-request';
import { useMutation } from './use-mutation';
import { PORTAL } from '../../config/constants';
export function usePortalForm(action: PortalAction, organizationId: string | undefined) {
  const state = useMutation();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = formCommand(action, new FormData(event.currentTarget), organizationId);
    return state.run(async () => {
      const result = await portalRequest(command);
      if ('error' in result) {
        state.setMessage(result.error ?? PORTAL.ERROR);
        return;
      }
      state.setSuccess(true);
      state.setMessage(PORTAL.SUCCESS);
      const data = result.data;
      if (data?.url) {
        safeNavigate(data.url);
        return;
      }
      if (action === 'create-organization' && data?.organizationId)
        router.push(`/app/${data.organizationId}`);
      else if (action === 'create-activity' && data?.activityId && organizationId)
        router.push(`/app/${organizationId}/activites/${data.activityId}`);
      router.refresh();
    });
  }
  return { pending: state.pending, message: state.message, success: state.success, submit };
}
function safeNavigate(url: string) {
  const target = new URL(url, window.location.origin);
  if (target.protocol === 'https:' || target.origin === window.location.origin)
    window.location.assign(target.href);
}
