import { sql } from 'drizzle-orm';
import type { PrivateProofStoragePort } from '../../core/ports/bank.port';
import type { PrivateFileTokenPort } from '../../core/ports/private-file.port';
import { PrivateFileKeySchema } from '../../core/validation/private-file';
import type { DrizzlePgDb } from '../db/client';
import { atomic, rows } from '../db/transaction';
import { PRIVATE_FILES } from '../../config/private-files';
import { ERROR_CODES, PAYMENT_RULES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';

function organizationForKey(key: string): string | null {
  return PrivateFileKeySchema.safeParse(key).success
    ? (key.split('/')[0]?.replace(/^org_/, '') ?? null)
    : null;
}
export class PostgresProofStorageAdapter implements PrivateProofStoragePort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly tokens: PrivateFileTokenPort,
    private readonly appUrl: string,
  ) {}
  uploadPrivateProof(input: Parameters<PrivateProofStoragePort['uploadPrivateProof']>[0]) {
    const organizationId = organizationForKey(input.storageKey);
    if (
      !organizationId ||
      input.contentType !== PRIVATE_FILES.MIME_TYPE ||
      !input.bytes.length ||
      input.bytes.length > PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES
    )
      return Promise.resolve(failure(ERROR_CODES.INVALID_PROOF_FILE, 'PrivateFile', 'upload'));
    return atomic(this.db, 'PrivateFile', async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${PRIVATE_FILES.QUOTA_LOCK},0))`,
      );
      const [total] = await rows<{ bytes: string }>(
        tx,
        sql`SELECT coalesce(sum(octet_length(bytes)),0)::text AS bytes FROM private_files`,
      );
      if (Number(total?.bytes ?? 0) + input.bytes.length > PRIVATE_FILES.MAX_TOTAL_BYTES)
        return failure(ERROR_CODES.INVALID_PROOF_FILE, 'PrivateFile', 'quota');
      await tx.execute(
        sql`INSERT INTO private_files(storage_key,organization_id,bytes) VALUES(${input.storageKey},${organizationId},${Buffer.from(input.bytes)})`,
      );
      return ok({ storageKey: input.storageKey });
    });
  }
  read(key: string) {
    const organizationId = organizationForKey(key);
    if (!organizationId)
      return Promise.resolve(failure(ERROR_CODES.NOT_FOUND, 'PrivateFile', 'read'));
    return atomic(this.db, 'PrivateFile', async (tx) => {
      const [file] = await rows<{ bytes: Buffer }>(
        tx,
        sql`SELECT bytes FROM private_files WHERE storage_key=${key} AND organization_id=${organizationId}`,
      );
      return file
        ? ok(new Uint8Array(file.bytes))
        : failure(ERROR_CODES.NOT_FOUND, 'PrivateFile', 'read');
    });
  }
  async getTemporaryAdminViewUrl(
    input: Parameters<PrivateProofStoragePort['getTemporaryAdminViewUrl']>[0],
  ) {
    const token = await this.tokens.sign(input.storageKey, input.expiresInSeconds);
    return token.ok
      ? ok({
          presignedUrl: `${this.appUrl}${PRIVATE_FILES.PATH}?token=${encodeURIComponent(token.value)}`,
        })
      : token;
  }
  deleteProofImmediately(key: string) {
    const organizationId = organizationForKey(key);
    if (!organizationId)
      return Promise.resolve(failure(ERROR_CODES.NOT_FOUND, 'PrivateFile', 'delete'));
    return atomic(this.db, 'PrivateFile', async (tx) => {
      await tx.execute(
        sql`DELETE FROM private_files WHERE storage_key=${key} AND organization_id=${organizationId}`,
      );
      return ok({ deleted: true as const });
    });
  }
}
