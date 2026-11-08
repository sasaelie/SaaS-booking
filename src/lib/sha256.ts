import { ENCODING } from '../config/constants';
import { ok, type Result } from './result';
import { unexpected } from './errors';
export async function sha256(value: string): Promise<Result<string>> {
  try {
    const bytes = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    );
    return ok(
      [...bytes]
        .map((byte) => byte.toString(ENCODING.HEX_RADIX).padStart(ENCODING.BYTE_HEX_WIDTH, '0'))
        .join(''),
    );
  } catch {
    return unexpected('Crypto', 'sha256');
  }
}
