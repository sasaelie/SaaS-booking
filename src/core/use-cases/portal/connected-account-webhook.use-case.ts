import type { ConnectAccountWebhookPort } from '../../ports/connect-gateway.port';
import type { HandlePaymentWebhookUseCase } from '../handle-stripe-webhook.use-case';
import { guardUseCase } from '../../../lib/guard-use-case';
export class ConnectedAccountWebhookUseCase {
  constructor(
    private readonly account: ConnectAccountWebhookPort,
    private readonly payment: HandlePaymentWebhookUseCase,
  ) {}
  execute(body: string, signature: string) {
    return guardUseCase('ConnectedAccountWebhook', 'execute', async () => {
      const result = await this.account.handle(body, signature);
      return result.ok ? this.payment.execute(body, signature) : result;
    });
  }
}
