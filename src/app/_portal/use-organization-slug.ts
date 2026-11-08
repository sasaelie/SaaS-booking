'use client';
import { useRef, useState } from 'react';
import { OrganizationSlugSchema } from '../../core/validation/portal-organization';
import { suggestOrganizationSlug } from '../../lib/suggest-organization-slug';
import { PORTAL } from '../../config/constants';

function validationMessage(value: string): string {
  const parsed = OrganizationSlugSchema.safeParse(value);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? PORTAL.SLUG_FORMAT;
  return parsed.data === value ? '' : PORTAL.SLUG_FORMAT;
}

export function useOrganizationSlug() {
  const [name, setName] = useState('');
  const [custom, setCustom] = useState<string | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const slug = custom ?? suggestOrganizationSlug(name);
  function clear() {
    setError('');
    ref.current?.setCustomValidity('');
  }
  function changeName(value: string) {
    setName(value);
    if (custom === null) clear();
  }
  function changeSlug(value: string) {
    setCustom(value);
    clear();
  }
  function validate() {
    const message = validationMessage(slug);
    setError(message);
    ref.current?.setCustomValidity(message);
  }
  return { slug, ref, error, changeName, changeSlug, validate };
}
