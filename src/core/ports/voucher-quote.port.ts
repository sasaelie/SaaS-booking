import type { Result } from '../../lib/result';
import type { VoucherPricingCalculation } from '../domain/voucher-engine';
export interface VoucherQuotePort {
  quote(
    organizationId: string,
    activityId: string,
    code: string,
  ): Promise<Result<VoucherPricingCalculation>>;
}
