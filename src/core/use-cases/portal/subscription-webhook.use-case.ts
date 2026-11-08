import type { SubscriptionWebhookPort } from '../../ports/subscription-webhook.port';
import { guardUseCase } from '../../../lib/guard-use-case';
export class HandleSubscriptionWebhookUseCase {
  constructor(private readonly gateway: SubscriptionWebhookPort) {}
  execute(body: string, signature: string) {
    return guardUseCase('SubscriptionWebhook', 'execute', () =>
      this.gateway.handle(body, signature),
    );
  }
}
