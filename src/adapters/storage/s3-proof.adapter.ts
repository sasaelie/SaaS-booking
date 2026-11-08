import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PrivateProofStoragePort } from '../../core/ports/bank.port';
import { ERROR_CODES, PAYMENT_RULES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
export class S3ProofStorageAdapter implements PrivateProofStoragePort {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}
  async uploadPrivateProof(
    input: Parameters<PrivateProofStoragePort['uploadPrivateProof']>[0],
  ): Promise<Result<{ readonly storageKey: string }>> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.storageKey,
          Body: input.bytes,
          ContentType: input.contentType,
          CacheControl: 'no-store',
        }),
      );
      return ok({ storageKey: input.storageKey });
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'ProofStorage', 'upload');
    }
  }
  async getTemporaryAdminViewUrl(
    input: Parameters<PrivateProofStoragePort['getTemporaryAdminViewUrl']>[0],
  ): Promise<Result<{ readonly presignedUrl: string }>> {
    try {
      const presignedUrl = await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: input.storageKey,
          ResponseContentDisposition: 'inline',
          ResponseCacheControl: 'no-store',
        }),
        {
          expiresIn: Math.min(input.expiresInSeconds, PAYMENT_RULES.PRESIGNED_URL_EXPIRY_SECONDS),
        },
      );
      return ok({ presignedUrl });
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'ProofStorage', 'view');
    }
  }
  async deleteProofImmediately(storageKey: string): Promise<Result<{ readonly deleted: true }>> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return ok({ deleted: true });
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'ProofStorage', 'delete');
    }
  }
}
