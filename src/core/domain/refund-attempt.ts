import { REFUND_RULES } from '../../config/refunds';
import { TIME } from '../../config/constants';
export function canCreateRefund(firstAttemptAt: string | undefined, now: Date): boolean {
  if (!firstAttemptAt) return true;
  const first = Date.parse(firstAttemptAt);
  const age = now.getTime() - first;
  return Number.isFinite(age) && age >= 0 && age < REFUND_RULES.SAFE_RETRY_HOURS * TIME.HOUR_MS;
}
