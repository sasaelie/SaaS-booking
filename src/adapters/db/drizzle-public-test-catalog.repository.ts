import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic, rows } from './transaction';
import { ok } from '../../lib/result';
export class DrizzlePublicTestCatalogRepository {
  constructor(private readonly db: DrizzlePgDb) {}
  exists(slug: string) {
    return atomic(this.db, 'PublicTestCatalog', async (tx) => {
      const [row] = await rows<{ published: boolean }>(
        tx,
        sql`SELECT EXISTS(SELECT 1 FROM publication WHERE slug=${slug} AND enabled) AS published`,
      );
      return ok(Boolean(row?.published));
    });
  }
}
