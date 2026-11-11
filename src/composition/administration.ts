import type { AuthorizationPort } from '../core/ports/authorization.port';
import { OidcAuthorizationAdapter } from '../adapters/auth/oidc-authorization.adapter';
import { DrizzleVoucherRepository } from '../adapters/db/drizzle-voucher.repository';
import { DrizzleClosureRepository } from '../adapters/db/drizzle-closure.repository';
import { DrizzlePauseRepository } from '../adapters/db/drizzle-pause.repository';
import { DrizzleBankRepository } from '../adapters/db/drizzle-bank.repository';
import { DrizzleGdprRepository } from '../adapters/db/drizzle-gdpr.repository';
import { ProofImageAdapter } from '../adapters/storage/proof-image.adapter';
import { VoucherLifecycleUseCase } from '../core/use-cases/voucher-lifecycle.use-case';
import { CloseSessionWithProtectionUseCase } from '../core/use-cases/close-session-with-protection.use-case';
import { AddPauseUseCase } from '../core/use-cases/add-pause.use-case';
import { BankTransferWorkflowUseCase } from '../core/use-cases/bank-transfer-workflow.use-case';
import { GdprRetentionUseCase } from '../core/use-cases/gdpr-retention.use-case';
import type { Runtime } from './runtime';
export function administration(app: Runtime, token: string, override?: AuthorizationPort) {
  const env = app.env;
  const settings =
    env.AUTH_ISSUER && env.AUTH_AUDIENCE && env.AUTH_JWKS_URL
      ? {
          issuer: env.AUTH_ISSUER,
          audience: env.AUTH_AUDIENCE,
          jwksUrl: env.AUTH_JWKS_URL,
        }
      : null;
  const authorization = override ?? new OidcAuthorizationAdapter(token, settings);
  return {
    voucher: new VoucherLifecycleUseCase({
      voucherRepo: new DrizzleVoucherRepository(app.db),
      authorization,
      secret: env.SELF_CANCEL_HMAC_SECRET,
    }),
    closure: new CloseSessionWithProtectionUseCase({
      closureRepo: new DrizzleClosureRepository(app.db),
      authorization,
    }),
    pause: new AddPauseUseCase({
      pauseRepo: new DrizzlePauseRepository(app.db),
      authorization,
    }),
    bank: new BankTransferWorkflowUseCase({
      bankRepo: new DrizzleBankRepository(app.db),
      storagePort: app.services.storage,
      imagePort: new ProofImageAdapter(),
      authorization,
      secret: env.SELF_CANCEL_HMAC_SECRET,
    }),
    gdpr: new GdprRetentionUseCase({
      operationalPurgeEnabled: env.OPERATIONAL_PURGE_ENABLED === 'true',
      gdprRepo: new DrizzleGdprRepository(app.db),
      authorization,
    }),
  };
}
