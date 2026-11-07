import sharp from 'sharp';
import { ERROR_CODES, JOB_RULES, PAYMENT_RULES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import type { ProofImagePort } from '../../core/ports/bank.port';
export class ProofImageAdapter implements ProofImagePort {
  async sanitize(bytes: Uint8Array): Promise<Result<Uint8Array>> {
    try {
      const output = await sharp(bytes, {
        limitInputPixels: JOB_RULES.MAX_IMAGE_PIXELS,
        failOn: 'warning',
      })
        .rotate()
        .png()
        .toBuffer();
      return output.byteLength <= PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES
        ? ok(new Uint8Array(output))
        : failure(ERROR_CODES.INVALID_PROOF_FILE, 'ProofImage', 'sanitize');
    } catch {
      return failure(ERROR_CODES.INVALID_PROOF_FILE, 'ProofImage', 'sanitize');
    }
  }
}
