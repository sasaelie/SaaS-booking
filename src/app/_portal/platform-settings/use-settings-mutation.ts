'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PlatformSettingsCommand } from '../../../core/validation/platform-settings';
import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
export function useSettingsMutation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  function execute(command: PlatformSettingsCommand, saved?: () => void) {
    start(async () => {
      try {
        const response = await fetch('/api/plateforme/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(command),
        });
        const body = (await response.json()) as { success?: boolean; code?: string };
        const valid = response.ok && body.success === true;
        setSuccess(valid);
        setMessage(
          valid
            ? command.action === 'publish'
              ? UI.PUBLISHED
              : command.action === 'unpublish'
                ? UI.UNPUBLISHED
                : UI.SUCCESS
            : body.code === 'CONFLICT'
              ? UI.CONFLICT
              : UI.ERROR,
        );
        if (valid) {
          saved?.();
          router.refresh();
        }
      } catch {
        setSuccess(false);
        setMessage(UI.ERROR);
      }
    });
  }
  return { pending, message, success, execute };
}
