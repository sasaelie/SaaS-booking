'use client';
import { useId, useState } from 'react';
import { SHARE_UI } from '../../config/constants';
import { embedInstallCode } from '../../lib/embed-install-code';
import { CopyCode } from './CopyCode';
export function WebsiteInstall({
  appUrl,
  slug,
}: {
  readonly appUrl: string;
  readonly slug: string;
}) {
  const [floating, setFloating] = useState(false);
  const id = useId();
  const code = embedInstallCode(appUrl, slug, floating ? 'floating' : 'inline');
  return (
    <>
      <fieldset className="sharing-placement">
        <legend>{SHARE_UI.PLACEMENT}</legend>
        <label>
          <input type="radio" name={id} checked={!floating} onChange={() => setFloating(false)} />
          {SHARE_UI.INLINE_CATALOG}
        </label>
        <label>
          <input type="radio" name={id} checked={floating} onChange={() => setFloating(true)} />
          {SHARE_UI.FLOATING_CATALOG}
        </label>
      </fieldset>
      <CopyCode key={code} value={code} buttonLabel={SHARE_UI.COPY_INSTALL} />
    </>
  );
}
