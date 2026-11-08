import { z } from 'zod';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { ConnectGatewayPort } from '../../ports/connect-gateway.port';
import { withPortalActor } from './actor';
import { ERROR_CODES, INPUT_LIMITS } from '../../../config/constants';
import { failure } from '../../../lib/errors';
export class ConnectUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly gateway: ConnectGatewayPort,
  ) {}
  authorize(raw: unknown) {
    return withPortalActor(this.identity, 'Connect', async (actor) => {
      const id = z.uuid().safeParse(raw);
      return id.success
        ? this.gateway.authorize(actor, id.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Connect', 'authorize');
    });
  }
  callback(raw: unknown) {
    return withPortalActor(this.identity, 'Connect', async (actor) => {
      const input = z
        .object({
          state: z.string().min(1).max(INPUT_LIMITS.TOKEN_MAX),
          code: z.string().min(1).max(INPUT_LIMITS.TOKEN_MAX),
        })
        .safeParse(raw);
      return input.success
        ? this.gateway.callback(actor, input.data.state, input.data.code)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Connect', 'callback');
    });
  }
  platform(raw: unknown) {
    return withPortalActor(this.identity, 'Connect', async (actor) => {
      const id = z.uuid().safeParse(raw);
      return id.success
        ? this.gateway.usePlatform(actor, id.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Connect', 'platform');
    });
  }
}
