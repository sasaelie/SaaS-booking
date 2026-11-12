import 'server-only';
import { createHmac } from 'node:crypto';
import { runtime } from './runtime';
import { portal } from './portal';
import { createDatabase } from '../adapters/db/client';
import { syncSimulation } from '../adapters/simulation/sync';
import { SimulationPaymentAdapter } from '../adapters/simulation/payment.adapter';
import { SimulationRepository } from '../adapters/simulation/repository';
import { SimulationUseCase } from '../core/use-cases/simulation.use-case';
import { SIMULATION } from '../config/simulation';
import { SimulationOrganizationSchema } from '../core/validation/simulation';
import { ERROR_CODES } from '../config/constants';
import { failure } from '../lib/errors';
import { ok } from '../lib/result';
import { guardUseCase } from '../lib/guard-use-case';
import { simulationServices } from './simulation-services';
let database: ReturnType<typeof createDatabase> | undefined;
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
    const schema = env.DATABASE_SCHEMA ?? 'public';
    if (refresh) {
      const sync = await syncSimulation(app.value.pool, schema, id.data);
      if (!sync.ok) return sync;
    }
    database ??= createDatabase(env.DATABASE_URL, schema + SIMULATION.SCHEMA_SUFFIX, env.DATABASE_SSL_CA);
    const secret = createHmac('sha256', env.SELF_CANCEL_HMAC_SECRET).update(SIMULATION.SECRET_CONTEXT).digest('hex');
    const repository = new SimulationRepository(database.db, id.data, secret);
    return ok({
      organization: organization.value,
      tests: new SimulationUseCase(repository),
      repository,
      ...simulationServices(database.db, id.data, secret, env.NEXT_PUBLIC_APP_URL, new SimulationPaymentAdapter()),
    });
  });
}
