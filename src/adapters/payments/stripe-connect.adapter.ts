import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import type { ConnectGatewayPort } from '../../core/ports/connect-gateway.port';
import type { PortalActor } from '../../core/ports/portal-models';
import type { DrizzlePgDb } from '../db/client';
import { atomic } from '../db/transaction';
import { organizations } from '../db/schema';
import { platformAudit } from '../db/schema/saas';
import { requireMembership, requireOperator } from '../db/portal/authorization';
import { createConnectState, consumeConnectState } from './connect-state';
import { ERROR_CODES } from '../../config/constants';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
interface Settings {
  readonly stripe: Stripe;
  readonly clientId: string | undefined;
  readonly appUrl: string;
}
export class StripeConnectAdapter implements ConnectGatewayPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly settings: Settings | null,
  ) {}
  async authorize(actor: PortalActor, id: string) {
    if (!this.settings?.clientId)
      return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Connect', 'configuration');
    const state = await createConnectState(this.db, actor, id);
    if (!state.ok) return state;
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: this.settings.clientId,
      scope: 'read_write',
      state: state.value,
      redirect_uri: `${this.settings.appUrl}/api/portal/stripe/callback`,
    });
    return ok({ url: `https://connect.stripe.com/oauth/authorize?${query}` });
  }
  async callback(actor: PortalActor, state: string, code: string) {
    if (!this.settings) return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Connect', 'configuration');
    const id = await consumeConnectState(this.db, actor, state);
    if (!id.ok) return id;
    try {
      const token = await this.settings.stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      });
      if (!token.stripe_user_id || token.scope !== 'read_write')
        return failure(ERROR_CODES.UNAUTHORIZED, 'Connect', 'scope');
      const account = await this.settings.stripe.accounts.retrieve(token.stripe_user_id);
      const attached = await attachAccount(
        this.db,
        actor,
        id.value,
        account.id,
        Boolean(account.charges_enabled && account.details_submitted),
      );
      return attached.ok ? ok({ organizationId: id.value }) : attached;
    } catch {
      return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Connect', 'callback');
    }
  }
  async usePlatform(actor: PortalActor, id: string) {
    if (!this.settings) return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Connect', 'configuration');
    const allowed = await atomic(this.db, 'Connect', async (tx) => {
      await requireOperator(tx, actor);
      await requireMembership(tx, actor, id, true);
      return ok(undefined);
    });
    if (!allowed.ok) return allowed;
    try {
      const account = await this.settings.stripe.accounts.retrieve(null);
      return atomic(this.db, 'Connect', async (tx) => {
        await requireOperator(tx, actor);
        await requireMembership(tx, actor, id, true);
        await tx
          .update(organizations)
          .set({
            merchantAccountId: null,
            stripeReady: Boolean(account.charges_enabled),
            usesPlatformPayments: true,
          })
          .where(eq(organizations.id, id));
        await tx.insert(platformAudit).values({
          organizationId: id,
          actorUserId: actor.id,
          action: 'PLATFORM_PAYMENTS_ENABLED',
        });
        return ok(undefined);
      });
    } catch {
      return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Connect', 'platform');
    }
  }
}
async function attachAccount(
  db: DrizzlePgDb,
  actor: PortalActor,
  id: string,
  accountId: string,
  ready: boolean,
) {
  return atomic(db, 'Connect', async (tx) => {
    await requireMembership(tx, actor, id, true);
    await tx
      .update(organizations)
      .set({ merchantAccountId: accountId, stripeReady: ready, usesPlatformPayments: false })
      .where(eq(organizations.id, id));
    await tx
      .insert(platformAudit)
      .values({ organizationId: id, actorUserId: actor.id, action: 'STRIPE_CONNECTED' });
    return ok(undefined);
  });
}
