'use client';
import { useState, type FormEvent } from 'react';
import { EMBED_HEALTH as H } from '../../config/embed-health';
import { embedCheckUrl } from '../../lib/embed-install-code';
export function SiteEmbedCheck({ slug }: { readonly slug: string }) {
  const [url, setUrl] = useState('');
  const [invalid, setInvalid] = useState(false);
  function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = embedCheckUrl(url, slug);
    setInvalid(!target);
    if (target) window.open(target, '_blank', 'noopener,noreferrer');
  }
  return (
    <form className="sharing-site-check portal-form" onSubmit={open}>
      <h3>{H.SITE_TITLE}</h3>
      <p className="portal-muted">{H.SITE_HINT}</p>
      <label className="portal-field">
        {H.SITE_LABEL}
        <input
          className="portal-input"
          type="url"
          value={url}
          required
          onChange={(event) => {
            setUrl(event.target.value);
            setInvalid(false);
          }}
          aria-invalid={invalid || undefined}
        />
      </label>
      {invalid ? <p role="alert">{H.SITE_INVALID}</p> : null}
      <button type="submit" className="portal-secondary-action">
        {H.SITE_OPEN}
      </button>
      <p className="portal-muted">{H.SITE_MISSING}</p>
    </form>
  );
}
