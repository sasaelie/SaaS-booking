import type { BrandMediaReaderPort } from '../../core/ports/brand-media.port';
import type { PrivateProofStoragePort } from '../../core/ports/bank.port';
import { PAYMENT_RULES, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export class BrandReaderAdapter implements BrandMediaReaderPort {
  constructor(private readonly storage: PrivateProofStoragePort) {}
  async read(key: string) {
    try {
      const link = await this.storage.getTemporaryAdminViewUrl({
        storageKey: key,
        expiresInSeconds: PAYMENT_RULES.PRESIGNED_URL_EXPIRY_SECONDS,
      });
      if (!link.ok) return link;
      const response = await fetch(link.value.presignedUrl, { cache: 'no-store' });
      if (
        !response.ok ||
        Number(response.headers.get('content-length')) > PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES
      )
        return failure(ERROR_CODES.NOT_FOUND, 'BrandMedia', 'read');
      const bytes = new Uint8Array(await response.arrayBuffer());
      return bytes.byteLength <= PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES
        ? ok(bytes)
        : failure(ERROR_CODES.INVALID_PROOF_FILE, 'BrandMedia', 'read');
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'BrandMedia', 'read');
    }
  }
}
