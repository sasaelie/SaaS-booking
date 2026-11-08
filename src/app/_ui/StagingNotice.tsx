import { STAGING } from '../../config/staging';

export function StagingNotice() {
  return process.env['APP_ENVIRONMENT'] === STAGING.MODE ? (
    <p className="staging-notice" role="note">
      {STAGING.NOTICE}
    </p>
  ) : null;
}
