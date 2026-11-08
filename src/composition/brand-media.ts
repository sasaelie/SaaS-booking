import 'server-only';
import { runtime } from './runtime';
import { authentication } from './authentication';
import { DrizzleBrandMediaRepository } from '../adapters/db/drizzle-brand-media.repository';
import { SessionIdentityAdapter } from '../adapters/auth/session-identity.adapter';
import { ProofImageAdapter } from '../adapters/storage/proof-image.adapter';
import { BrandReaderAdapter } from '../adapters/storage/brand-reader.adapter';
import {
  UploadBrandMediaUseCase,
  ReadBrandMediaUseCase,
} from '../core/use-cases/portal/brand-media.use-case';
import { ok } from '../lib/result';
export function publicBrandMedia() {
  const app = runtime();
  if (!app.ok) return app;
  const repository = new DrizzleBrandMediaRepository(app.value.db);
  return ok(
    new ReadBrandMediaUseCase(repository, new BrandReaderAdapter(app.value.services.storage)),
  );
}
export function brandMedia(headers: Headers) {
  const app = runtime();
  if (!app.ok) return app;
  const auth = authentication();
  if (!auth.ok) return auth;
  return ok(
    new UploadBrandMediaUseCase(
      new SessionIdentityAdapter(auth.value, headers),
      new DrizzleBrandMediaRepository(app.value.db),
      new ProofImageAdapter(),
      app.value.services.storage,
    ),
  );
}
