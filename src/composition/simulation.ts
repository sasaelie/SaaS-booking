import 'server-only';
import { runtime } from './runtime';
import { portal } from './portal';
import { syncSimulation } from '../adapters/simulation/sync';
import { SimulationPaymentAdapter } from '../adapters/simulation/payment.adapter';
import { SimulationRepository } from '../adapters/simulation/repository';
import { SimulationUseCase } from '../core/use-cases/simulation.use-case';
import { SimulationOrganizationSchema } from '../core/validation/simulation';
import { ERROR_CODES } from '../config/constants';
import { failure } from '../lib/errors';
import { ok } from '../lib/result';
import { guardUseCase } from '../lib/guard-use-case';
import { simulationServices } from './simulation-services';
import { simulationRuntime } from './simulation-runtime';
export function simulation(headers: Headers, raw: unknown, refresh = false) {
  return guardUseCase('Simulation', 'authorize', async () => {
    const id = SimulationOrganizationSchema.safeParse(raw);
    if (!id.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Simulation', 'organization');
    const app = runtime();
    const studio = portal(headers);
    if (!app.ok) return app;
    if (!studio.ok) return studio;
    const organization = await studio.value.organizations.get(id.data);
    if (!organization.ok) return organization;
    const env = app.value.env;
    const isolated = simulationRuntime(env);
    if (refresh) {
      const sync = await syncSimulation(app.value.pool, isolated.sourceSchema, id.data);
      if (!sync.ok) return sync;
    }
    const repository = new SimulationRepository(isolated.db, id.data, isolated.secret);
    return ok({
      organization: organization.value,
      tests: new SimulationUseCase(repository),
      repository,
      ...simulationServices(
        isolated.db,
        id.data,
        isolated.secret,
        env.NEXT_PUBLIC_APP_URL,
        new SimulationPaymentAdapter(),
      ),
    });
  });
}
