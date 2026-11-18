import { isIP } from 'node:net';
import { SECURITY } from '../config/security';
export function clientSource(headers: Headers, vercel = process.env['VERCEL'] === '1') {
  if (!vercel) return SECURITY.LOCAL_SOURCE;
  const value = headers.get(SECURITY.TRUSTED_IP_HEADER)?.trim() ?? '';
  const version = isIP(value);
  if (!version) return SECURITY.LOCAL_SOURCE;
  return value.includes(':') ? new URL(`http://[${value}]/`).hostname : value;
}
