'use client';
import { useState } from 'react';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
export function RecoveryCodes({ codes }: { readonly codes: readonly string[] }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className="administrator-recovery-codes" aria-label={C.CODES_TITLE}>
      <h2>{C.CODES_TITLE}</h2>
      <p className="portal-muted">{C.CODES_NOTE}</p>
      <ul>
        {codes.map((code) => (
          <li key={code}>
            <code>{code}</code>
          </li>
        ))}
      </ul>
      <div className="portal-actions">
        <button
          className="liquid-ice-button portal-button"
          onClick={() => downloadCodes(codes)}
          type="button"
        >
          {C.SAVE_CODES}
        </button>
        <button type="button" className="portal-secondary-action" onClick={() => void copy()}>
          {C.COPY_CODES}
        </button>
      </div>
      {copied ? <p role="status">{C.COPIED}</p> : null}
    </section>
  );
}

function downloadCodes(codes: readonly string[]) {
  const url = URL.createObjectURL(
    new Blob([C.CODES_TITLE + '\n\n' + codes.join('\n') + '\n\n' + C.CODES_NOTE], {
      type: 'text/plain;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = C.DOWNLOAD;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), C.DOWNLOAD_REVOKE_MS);
}
