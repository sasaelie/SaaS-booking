import 'server-only';
import { runtime } from './runtime';
import { simulationRuntime } from './simulation-runtime';
import { SimulationParticipantLoginRepository } from '../adapters/simulation/participant-login.repository';
import { SimulationParticipantLoginUseCase } from '../core/use-cases/simulation-participant-login.use-case';
import { ok } from '../lib/result';
export function simulationParticipantLogin() {
  const app = runtime();
  if (!app.ok) return app;
  const isolated = simulationRuntime(app.value.env);
  return ok(
    new SimulationParticipantLoginUseCase(
      new SimulationParticipantLoginRepository(isolated.db, isolated.secret),
    ),
  );
}
