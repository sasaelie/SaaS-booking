'use client';
import type { FormEvent } from 'react';
import { AUTH_UI } from '../../config/constants';
import { authRequest, type AuthMode } from './auth-request';
import { useMutation } from '../_portal/use-mutation';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { planPath } from '../../lib/plan-selection';
export function useAuthForm(mode: AuthMode, plan: PlanIntent | null = null) {
  const state = useMutation();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const command = authRequest(
      mode,
      new FormData(event.currentTarget),
      query.get('token') ?? fragment.get('token') ?? '',
      plan,
    );
    if ('error' in command) {
      state.setMessage(command.error);
      state.setSuccess(false);
      return;
    }
    return state.run(async () => {
      const response = await fetch(`/api/auth/${command.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command.body),
      });
      if (!response.ok) {
        state.setMessage(mode === 'SIGN_IN' ? AUTH_UI.INVALID_LOGIN : AUTH_UI.ERROR);
        return;
      }
      if (mode === 'SIGN_IN') {
        window.location.assign(planPath('/app', plan));
        return;
      }
      state.setSuccess(true);
      state.setMessage(successMessage(mode));
    });
  }
  return { pending: state.pending, message: state.message, success: state.success, submit };
}
function successMessage(mode: AuthMode) {
  return mode === 'SIGN_UP'
    ? AUTH_UI.VERIFY
    : mode === 'FORGOT'
      ? AUTH_UI.FORGOT_SENT
      : AUTH_UI.RESET_DONE;
}
