import { z } from 'zod';
import { SAAS, ERROR_CODES } from '../../../config/constants';
import type { PublicCatalogPort } from '../../ports/public-catalog.port';
import { guardUseCase } from '../../../lib/guard-use-case';
import { failure } from '../../../lib/errors';
export class PublicCatalogUseCase {
  constructor(private readonly repository: PublicCatalogPort) {}
  execute(raw: unknown) {
    return guardUseCase('Catalog', 'execute', async () => {
      const slug = z.string().min(1).max(SAAS.SLUG_MAX).safeParse(raw);
      return slug.success
        ? this.repository.find(slug.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Catalog', 'input');
    });
  }
}
