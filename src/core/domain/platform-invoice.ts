import { PLATFORM_BILLING as BILL } from '../../config/platform-billing';
import type { InvoiceAmounts } from '../ports/platform-billing';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export function invoiceAmounts(grossCents: number, taxRateBps: number) {
  if (
    !Number.isSafeInteger(grossCents) ||
    grossCents <= 0 ||
    grossCents > BILL.MAX_MONEY ||
    !Number.isInteger(taxRateBps) ||
    taxRateBps < 0 ||
    taxRateBps > BILL.MAX_RATE
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformInvoice', 'amount');
  const netCents = Math.round((grossCents * BILL.BASIS) / (BILL.BASIS + taxRateBps));
  return ok({ grossCents, netCents, taxCents: grossCents - netCents });
}
export function creditAmounts(
  grossCents: number,
  original: InvoiceAmounts,
  previous: InvoiceAmounts,
  taxRateBps: number,
) {
  const netLeft = original.netCents - previous.netCents;
  const taxLeft = original.taxCents - previous.taxCents;
  const remaining = original.grossCents - previous.grossCents;
  if (grossCents > remaining || netLeft < 0 || taxLeft < 0)
    return failure(ERROR_CODES.CONFLICT, 'PlatformInvoice', 'credit-limit');
  const split = invoiceAmounts(grossCents, taxRateBps);
  if (!split.ok) return split;
  const taxCents = Math.min(taxLeft, Math.max(split.value.taxCents, grossCents - netLeft));
  return ok({ grossCents, netCents: grossCents - taxCents, taxCents });
}
