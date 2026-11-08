import { z } from 'zod';
import type { BrandMediaRepositoryPort, BrandMediaReaderPort } from '../../ports/brand-media.port';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { ProofImagePort, PrivateProofStoragePort } from '../../ports/bank.port';
import { validateBankProofBinary } from '../../domain/proof-validator';
import { withPortalActor } from './actor';
import { guardUseCase } from '../../../lib/guard-use-case';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { ERROR_CODES } from '../../../config/constants';
const MediaSchema = z.object({ organizationId: z.uuid(), kind: z.enum(['logo', 'background']) });
export class UploadBrandMediaUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: BrandMediaRepositoryPort,
    private readonly image: ProofImagePort,
    private readonly storage: PrivateProofStoragePort,
  ) {}
  remove(raw: unknown) {
    return withPortalActor(this.identity, 'BrandMedia', async (actor) => {
      const input = MediaSchema.safeParse(raw);
      if (!input.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'BrandMedia', 'remove');
      return this.repository.attach(actor, input.data.organizationId, input.data.kind, null);
    });
  }
  execute(raw: unknown, bytes: Uint8Array) {
    return withPortalActor(this.identity, 'BrandMedia', async (actor) => {
      const input = MediaSchema.safeParse(raw);
      if (!input.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'BrandMedia', 'input');
      const permitted = await this.repository.authorize(actor, input.data.organizationId);
      if (!permitted.ok) return permitted;
      const binary = validateBankProofBinary(bytes);
      if (!binary.ok) return binary;
      const image = await this.image.sanitize(bytes);
      if (!image.ok) return image;
      const key = `org_${input.data.organizationId}/branding/${crypto.randomUUID()}.png`;
      const stage = await this.repository.stage(actor, input.data.organizationId, key);
      if (!stage.ok) return stage;
      const uploaded = await this.storage.uploadPrivateProof({
        storageKey: key,
        bytes: image.value,
        contentType: 'image/png',
      });
      if (!uploaded.ok) return uploaded;
      const attached = await this.repository.attach(
        actor,
        input.data.organizationId,
        input.data.kind,
        key,
      );
      return attached.ok ? ok(undefined) : attached;
    });
  }
}
export class ReadBrandMediaUseCase {
  constructor(
    private readonly repository: BrandMediaRepositoryPort,
    private readonly reader: BrandMediaReaderPort,
  ) {}
  execute(raw: unknown) {
    return guardUseCase('BrandMedia', 'read', async () => {
      const input = MediaSchema.safeParse(raw);
      if (!input.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'BrandMedia', 'read');
      const key = await this.repository.asset(input.data.organizationId, input.data.kind);
      return key.ok ? this.reader.read(key.value) : key;
    });
  }
}
