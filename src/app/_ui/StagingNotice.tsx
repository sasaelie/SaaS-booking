import { STAGING } from '../../config/staging';
import { PUBLIC_TEST, publicTestEnabled } from '../../config/public-test';

export function StagingNotice() {
  return process.env['APP_ENVIRONMENT'] === STAGING.MODE ? (
    <p className="staging-notice" role="note">
      {publicTestEnabled() ? PUBLIC_TEST.NOTICE : STAGING.NOTICE}
    </p>
  ) : null;
}
