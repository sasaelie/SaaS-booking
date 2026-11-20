import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WEBSITE_PREVIEW as W } from '../../config/website-preview';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { guardUseCase } from '../../lib/guard-use-case';
import { ok } from '../../lib/result';
export class WebsitePreviewDocumentAdapter {
  render(nonce: string | null) {
    return guardUseCase('WebsitePreview', 'document', async () => {
      if (!nonce || !/^[A-Za-z0-9+/=]{40,128}$/.test(nonce))
        return failure(ERROR_CODES.INTERNAL_ERROR, 'WebsitePreview', 'nonce');
      const source = await readFile(join(process.cwd(), W.TEMPLATE_FILE), 'utf8');
      return ok(source.replaceAll(W.NONCE_MARKER, nonce));
    });
  }
}
