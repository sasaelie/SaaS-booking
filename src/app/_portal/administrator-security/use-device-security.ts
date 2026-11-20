'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { AdministratorSecurityCommand } from '../../../core/validation/administrator-security';
import { AdministratorSecurityCommandSchema } from '../../../core/validation/administrator-security';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { useMutation } from '../use-mutation';
import { securityRequest, SecurityRequestError } from './security-request';
import {
  DeviceRegistrationOptionsSchema,
  DeviceAuthenticationOptionsSchema,
} from './device-options';
type Ceremony = { kind: 'register' | 'authenticate'; options: Record<string, unknown> };
type Control = {
  mutation: ReturnType<typeof useMutation>;
  refresh: () => void;
  setCodes: (codes: readonly string[]) => void;
  setCeremony: (ceremony: Ceremony | null) => void;
  setTotpSecret: (secret: string | null) => void;
  setEmailState: (state: { sent: boolean; next: string | null }) => void;
};
export function useDeviceSecurity() {
  const mutation = useMutation(),
    router = useRouter();
  const [codes, setCodes] = useState<readonly string[]>([]),
    [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null),
    [emailState, setEmailState] = useState<{ sent: boolean; next: string | null }>({
      sent: false,
      next: null,
    });
  const control = {
    mutation,
    refresh: () => router.refresh(),
    setCodes,
    setCeremony,
    setTotpSecret,
    setEmailState,
  };
  function execute(raw: unknown) {
    const parsed = AdministratorSecurityCommandSchema.safeParse(raw);
    if (!parsed.success) {
      mutation.setMessage(C.ERROR);
      return;
    }
    runTask(() => dispatch(parsed.data, control), control);
  }
  return {
    ...mutation,
    codes,
    totpSecret,
    emailState,
    ceremony,
    execute,
    confirmDevice: () => {
      if (ceremony) runTask(() => finishCeremony(ceremony, control), control);
    },
    cancelCeremony: () => setCeremony(null),
  };
}
function runTask(task: () => Promise<void>, control: Control) {
  void control.mutation.run(async () => {
    try {
      await task();
    } catch (error) {
      control.mutation.setMessage(
        error instanceof SecurityRequestError ? error.message : C.ABORTED,
      );
    }
  });
}
async function dispatch(command: AdministratorSecurityCommand, control: Control) {
  const data = await securityRequest(command);
  if (data.options) {
    control.setCeremony({
      kind: command.action === 'register-options' ? 'register' : 'authenticate',
      options: data.options,
    });
    return;
  }
  if (data.recoveryCodes) control.setCodes(data.recoveryCodes);
  if (data.totpSecret) control.setTotpSecret(data.totpSecret);
  if (data.emailSent) control.setEmailState({ sent: true, next: data.emailNextSendAt ?? null });
  if (
    command.action === 'totp-confirm' ||
    command.action === 'disable' ||
    command.action === 'activate'
  )
    control.setTotpSecret(null);
  if (
    command.action === 'email-confirm' ||
    command.action === 'email-verify' ||
    command.action === 'disable' ||
    command.action === 'activate'
  )
    control.setEmailState({ sent: false, next: null });
  if (command.action === 'activate' || command.action === 'disable') control.setCodes([]);
  control.mutation.setMessage(C.SUCCESS);
  control.mutation.setSuccess(true);
  control.refresh();
}
async function finishCeremony(ceremony: Ceremony, control: Control) {
  try {
    const raw =
      ceremony.kind === 'register'
        ? {
            action: 'register-finish',
            response: await startRegistration({
              optionsJSON: DeviceRegistrationOptionsSchema.parse(ceremony.options),
            }),
          }
        : {
            action: 'authenticate-finish',
            response: await startAuthentication({
              optionsJSON: DeviceAuthenticationOptionsSchema.parse(ceremony.options),
            }),
          };
    await dispatch(AdministratorSecurityCommandSchema.parse(raw), control);
  } finally {
    control.setCeremony(null);
  }
}
export type DeviceSecurity = ReturnType<typeof useDeviceSecurity>;
