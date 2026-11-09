import { expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { issuedVoucher, changePrice } from './lifecycle-fixtures';
import { rawInput, reserve } from './fixtures';
import * as codes from '../../src/adapters/db/vouchers/code';
import { rescheduleVouchers } from '../../src/adapters/db/schema';
it('rolls back the reservation and preserves the original credit if a generated remainder code collides', async () => {
  const original = await issuedVoucher();
  const context = await changePrice(original.context, 2000);
  const input = { ...rawInput(context), voucherCode: original.voucher.code };
  const spy = vi.spyOn(codes, 'newVoucherCode').mockReturnValue(original.voucher.code);
  try {
    expect((await reserve(input)).ok).toBe(false);
    const [source] = await db
      .select()
      .from(rescheduleVouchers)
      .where(eq(rescheduleVouchers.id, original.voucher.id));
    expect(source?.status).toBe('ACTIVE');
  } finally {
    spy.mockRestore();
  }
  expect((await reserve(input)).ok).toBe(true);
  expect(
    await db.select().from(rescheduleVouchers).where(eq(rescheduleVouchers.kind, 'REMAINDER')),
  ).toHaveLength(1);
});
