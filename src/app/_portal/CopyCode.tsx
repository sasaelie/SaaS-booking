'use client';
import { useState } from 'react';
import { SHARE_UI } from '../../config/constants';
export function CopyCode({ value }: { readonly value: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(SHARE_UI.COPIED);
    } catch {
      setMessage(SHARE_UI.COPY_ERROR);
    }
  }
  return (
    <div className="portal-list">
      <code className="portal-share-code">{value}</code>
      <button type="button" className="liquid-ice-button portal-button" onClick={copy}>
        {SHARE_UI.COPY}
      </button>
      {message ? (
        <p role="status" className="portal-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
