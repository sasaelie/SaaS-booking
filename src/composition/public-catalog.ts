import 'server-only';
import { runtime } from './runtime';
import { ok } from '../lib/result';
import { DrizzlePublicCatalogRepository } from '../adapters/db/drizzle-public-catalog.repository';
import { PublicCatalogUseCase } from '../core/use-cases/portal/public-catalog.use-case';
export function publicCatalog() {
  const app = runtime();
  return app.ok
    ? ok(new PublicCatalogUseCase(new DrizzlePublicCatalogRepository(app.value.db)))
    : app;
}
