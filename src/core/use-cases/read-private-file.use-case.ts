import type { PrivateProofStoragePort } from '../ports/bank.port';
import type { PrivateFileTokenPort } from '../ports/private-file.port';
import { PrivateFileTokenSchema } from '../validation/private-file';
import { guardUseCase } from '../../lib/guard-use-case';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export class ReadPrivateFileUseCase {
  constructor(
    private readonly tokens: PrivateFileTokenPort,
    private readonly storage: PrivateProofStoragePort,
  ) {}
  execute(raw: unknown) {
    return guardUseCase('PrivateFile', 'read', async () => {
      const parsed = PrivateFileTokenSchema.safeParse(raw);
      if (!parsed.success) return failure(ERROR_CODES.UNAUTHORIZED, 'PrivateFile', 'token');
      const key = await this.tokens.verify(parsed.data);
      if (!key.ok) return key;
      return this.storage.read
        ? this.storage.read(key.value)
        : failure(ERROR_CODES.NOT_FOUND, 'PrivateFile', 'storage');
    });
  }
}
