import { readEnvironment } from '../config/env';
import { publicTestEnabled } from '../config/public-test';
import { createDatabase } from '../adapters/db/client';
import { DrizzlePublicTestCatalogRepository } from '../adapters/db/drizzle-public-test-catalog.repository';
let repository: DrizzlePublicTestCatalogRepository | undefined;
export async function publicTestCatalogAvailable(slug: string) {
  const env = readEnvironment();
  if (!env.ok || !publicTestEnabled(env.value)) return false;
  repository ??= new DrizzlePublicTestCatalogRepository(
    createDatabase(env.value.DATABASE_URL, env.value.DATABASE_SCHEMA, env.value.DATABASE_SSL_CA).db,
  );
  const result = await repository.exists(slug);
  return result.ok && result.value;
}
