'use client';
import { useState } from 'react';
export function BrandLogo({ src }: { readonly src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img className="ice-organization-logo" src={src} alt="" onError={() => setFailed(true)} />
  ) : (
    <span className="ice-brand-mark" aria-hidden="true" />
  );
}
