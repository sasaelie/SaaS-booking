import 'server-only';
import { runtime } from './runtime';
import { authentication } from './authentication';
import { simulationRuntime } from './simulation-runtime';
import { SessionIdentityAdapter } from '../adapters/auth/session-identity.adapter';
import { SimulationParticipantLoginRepository } from '../adapters/simulation/participant-login.repository';
import { SimulationParticipantLoginUseCase } from '../core/use-cases/simulation-participant-login.use-case';
import { ok } from '../lib/result';
export function simulationParticipantLogin(headers: Headers) {
  const app = runtime();
  if (!app.ok) return app;
  const auth = authentication();
  if (!auth.ok) return auth;
  const isolated = simulationRuntime(app.value.env);
  return ok(
    new SimulationParticipantLoginUseCase(
      new SessionIdentityAdapter(auth.value, headers),
      new SimulationParticipantLoginRepository(isolated.db, isolated.sourceSchema, isolated.secret),
    ),
  );
}
