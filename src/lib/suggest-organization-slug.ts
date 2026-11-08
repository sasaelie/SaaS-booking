import { SAAS } from '../config/constants';

export function suggestOrganizationSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SAAS.SLUG_MAX)
    .replace(/-+$/g, '');
}
