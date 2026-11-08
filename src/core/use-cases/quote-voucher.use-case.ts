import { guardUseCase } from '../../lib/guard-use-case';
import { z } from 'zod';
import { INPUT_LIMITS, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import type { VoucherQuotePort } from '../ports/voucher-quote.port';
const QuoteSchema = z.object({
  organizationId: z.uuid(),
  activityId: z.uuid(),
  code: z.string().trim().toUpperCase().min(1).max(INPUT_LIMITS.KEY_MAX),
});
export class QuoteVoucherUseCase {
  constructor(private readonly repository: VoucherQuotePort) {}
  async execute(raw: unknown) {
    return guardUseCase('quote-voucher.use-case.ts', 'execute', async () => {
      const parsed = QuoteSchema.safeParse(raw);
      return parsed.success
        ? this.repository.quote(
            parsed.data.organizationId,
            parsed.data.activityId,
            parsed.data.code,
          )
        : failure(ERROR_CODES.VALIDATION_FAILED, 'VoucherQuote', 'execute');
    });
  }
}
