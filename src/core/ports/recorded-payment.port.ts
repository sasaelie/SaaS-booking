import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type { RecordedPaymentInput } from '../validation/recorded-payment';
export interface RecordedPaymentPort {
  record(actor: PortalActor, input: RecordedPaymentInput): Promise<Result<void>>;
}
