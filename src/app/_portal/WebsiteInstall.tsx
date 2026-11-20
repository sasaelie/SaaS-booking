'use client';
import { useId, useState } from 'react';
import { EMBED, SHARE_UI } from '../../config/constants';
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
  const code = `<script src="${appUrl}/widget.js?v=${EMBED.CATALOG_VERSION}" data-organization="${slug}" data-mode="${floating ? 'floating' : 'inline'}" defer></script>`;
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
