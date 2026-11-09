import { expect, it, vi, afterEach } from 'vitest';
import { evaluateCancellationEligibility } from '../../src/core/domain/voucher-engine';
import { PAYMENT_RULES } from '../../src/config/constants';
import { validateBankProofBinary } from '../../src/core/domain/proof-validator';
import { sendOperation } from '../../src/app/manage/management-response';
afterEach(() => vi.unstubAllGlobals());
it.each([
  [72, true],
  [71.999, false],
  [0.001, false],
])('applies the 72-hour cancellation boundary at %s hours', (hours, expected) => {
  const cancelledAt = new Date('2026-11-09T10:00:00Z');
  const result = evaluateCancellationEligibility({
    cancelledAt,
    sessionStartsAt: new Date(cancelledAt.getTime() + hours * 3600000),
    noticeHoursRequired: 72,
    amountPaidCents: 2500,
    adminOverride: false,
  });
  expect(result.ok && result.value.eligibleForVoucher).toBe(expected);
});
it('rejects a proof exceeding the direct upload limit', () => {
  const bytes = new Uint8Array(PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES + 1);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(
    validateBankProofBinary(bytes.subarray(0, PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES)).ok,
  ).toBe(true);
  expect(validateBankProofBinary(bytes).ok).toBe(false);
});
it('does not treat an HTML success page as a confirmed operation', async () => {
  vi.stubGlobal('fetch', async () => new Response('<html>proxy error</html>', { status: 200 }));
  expect((await sendOperation(new FormData(), 'test-only-token', true)).ok).toBe(false);
});
it('rejects an explicit failure even if a proxy returns HTTP 200', async () => {
  vi.stubGlobal('fetch', async () => Response.json({ success: false }, { status: 200 }));
  expect((await sendOperation(new FormData(), 'test-only-token', true)).ok).toBe(false);
});
