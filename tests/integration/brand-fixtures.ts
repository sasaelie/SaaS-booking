import sharp from 'sharp';
import { db } from './database';
import { portalFixture } from './portal-fixtures';
import { DrizzleBrandMediaRepository } from '../../src/adapters/db/drizzle-brand-media.repository';
import { UploadBrandMediaUseCase } from '../../src/core/use-cases/portal/brand-media.use-case';
import { ProofImageAdapter } from '../../src/adapters/storage/proof-image.adapter';
import type { PrivateProofStoragePort } from '../../src/core/ports/bank.port';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
export async function brandFixture() {
  const owner = await portalFixture();
  const files = new Map<string, Uint8Array>();
  const state = { failUpload: false };
  const storage: PrivateProofStoragePort = {
    async uploadPrivateProof(input) {
      if (state.failUpload) return failure('INTERNAL_ERROR', 'TestStorage', 'upload');
      files.set(input.storageKey, input.bytes);
      return ok({ storageKey: input.storageKey });
    },
    async getTemporaryAdminViewUrl() {
      return ok({ presignedUrl: 'https://private.example/local' });
    },
    async deleteProofImmediately(key) {
      files.delete(key);
      return ok({ deleted: true });
    },
  };
  const repository = new DrizzleBrandMediaRepository(db);
  const image = await brandImage();
  const useCase = new UploadBrandMediaUseCase(
    { current: async () => ok(owner.actor) },
    repository,
    new ProofImageAdapter(),
    storage,
  );
  return {
    ...owner,
    repository,
    files,
    state,
    storage,
    image,
    useCase,
    input: { organizationId: owner.organizationId, kind: 'logo' },
  };
}

function brandImage() {
  return sharp({
    create: { width: 8, height: 8, channels: 4, background: { r: 30, g: 80, b: 50, alpha: 1 } },
  })
    .png()
    .toBuffer();
}
