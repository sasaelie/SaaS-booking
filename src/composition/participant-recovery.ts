import 'server-only';
import { runtime } from './runtime';
import { authentication } from './authentication';
import { SessionIdentityAdapter } from '../adapters/auth/session-identity.adapter';
import { ParticipantRecoveryRepository } from '../adapters/db/participant/recovery';
import { ParticipantRecoveryUseCase } from '../core/use-cases/participant-recovery.use-case';
import { ok } from '../lib/result';
export function participantRecovery(headers: Headers) {
  const app = runtime();
  if (!app.ok) return app;
  const auth = authentication();
  if (!auth.ok) return auth;
  return ok(
    new ParticipantRecoveryUseCase(
      new SessionIdentityAdapter(auth.value, headers),
      new ParticipantRecoveryRepository(app.value.db, app.value.env.SELF_CANCEL_HMAC_SECRET),
    ),
  );
}
