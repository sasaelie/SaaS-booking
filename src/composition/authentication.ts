import { sendAuthEmail } from '../adapters/auth/auth-email';
import 'server-only';
import { runtime } from './runtime';
import { createApplicationAuth, type ApplicationAuth } from '../adapters/auth/application-auth';
import { failure } from '../lib/errors';
import { ok, type Result } from '../lib/result';
import { ERROR_CODES } from '../config/constants';
let instance: ApplicationAuth | undefined;
export function authentication(): Result<ApplicationAuth> {
  if (instance) return ok(instance);
  const app = runtime();
  if (!app.ok) return app;
  const secret = app.value.env.BETTER_AUTH_SECRET;
  if (!secret) return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Authentication', 'configuration');
  instance = createApplicationAuth(app.value.pool, app.value.env, secret, (to, url, reset) =>
    sendAuthEmail(app.value.services.resend, app.value.env.MAIL_FROM, to, url, reset),
  );
  return ok(instance);
}
