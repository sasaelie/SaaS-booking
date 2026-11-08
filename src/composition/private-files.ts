import 'server-only';
import { runtime } from './runtime';
import { ReadPrivateFileUseCase } from '../core/use-cases/read-private-file.use-case';
import { PrivateFileTokenAdapter } from '../adapters/storage/private-file-token.adapter';
import { ok } from '../lib/result';
export function privateFiles() {
  const app = runtime();
  return app.ok
    ? ok(
        new ReadPrivateFileUseCase(
          new PrivateFileTokenAdapter(app.value.env.SELF_CANCEL_HMAC_SECRET),
          app.value.services.storage,
        ),
      )
    : app;
}
