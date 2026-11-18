import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
import type { useSettingsMutation } from './use-settings-mutation';
export type SettingsMutation = ReturnType<typeof useSettingsMutation>;
export function SettingsFeedback({
  action,
  invalid = false,
}: {
  readonly action: SettingsMutation;
  readonly invalid?: boolean;
}) {
  return (
    <>
      {invalid ? (
        <p className="portal-notice" role="alert">
          {UI.ERROR}
        </p>
      ) : null}
      {action.message ? (
        <p className="portal-notice" role={action.success ? 'status' : 'alert'}>
          {action.message}
        </p>
      ) : null}
    </>
  );
}
