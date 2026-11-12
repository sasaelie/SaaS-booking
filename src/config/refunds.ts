export const REFUND_STATES = {
  SUCCEEDED: 'SUCCEEDED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
} as const;
export type RefundState = (typeof REFUND_STATES)[keyof typeof REFUND_STATES];
export const REFUND_RULES = { SAFE_RETRY_HOURS: 23 } as const;
