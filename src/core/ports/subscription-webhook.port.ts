import type { Result } from '../../lib/result';
export interface SubscriptionWebhookPort {
  handle(body: string, signature: string): Promise<Result<void>>;
}
