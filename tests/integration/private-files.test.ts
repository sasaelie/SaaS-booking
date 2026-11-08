import { expect, it } from 'vitest';
import sharp from 'sharp';
import { sql } from 'drizzle-orm';
import { db } from './database';
import { DrizzleSelfBookingRepository } from '../../src/adapters/db/drizzle-self-booking.repository';
import { ReadSelfBookingUseCase } from '../../src/core/use-cases/read-self-booking.use-case';
import { fixture, rawInput, reserve } from './fixtures';
import { required } from '../../src/adapters/db/transaction';
import { DrizzleBankRepository } from '../../src/adapters/db/drizzle-bank.repository';
import { PostgresProofStorageAdapter } from '../../src/adapters/storage/postgres-proof.adapter';
import { PrivateFileTokenAdapter } from '../../src/adapters/storage/private-file-token.adapter';
import { BankTransferWorkflowUseCase } from '../../src/core/use-cases/bank-transfer-workflow.use-case';
import { ReadPrivateFileUseCase } from '../../src/core/use-cases/read-private-file.use-case';
import { signSelfCancelToken } from '../../src/core/domain/self-service-token';
import { ok } from '../../src/lib/result';
import { PAYMENT_MODES } from '../../src/config/constants';
const secret = 'local_private_file_test_secret_123456789';
const tokens = new PrivateFileTokenAdapter(secret);
const storage = new PostgresProofStorageAdapter(db, tokens, 'http://localhost:3004');
const reader = new ReadPrivateFileUseCase(tokens, storage);
async function setup() {
  const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
  const booking = required(await reserve(rawInput(context)));
  const token = required(
    await signSelfCancelToken(
      {
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        version: 0,
        expUnixSeconds: Math.floor(Date.now() / 1000) + 3600,
      },
      secret,
    ),
  );
  const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } })
    .png()
    .toBuffer();
  const workflow = new BankTransferWorkflowUseCase({
    storagePort: storage,
    bankRepo: new DrizzleBankRepository(db),
    secret,
    imagePort: {
      async sanitize(value) {
        return ok(value);
      },
    },
    authorization: {
      async authorizeOrganizationAdmin() {
        return ok(undefined);
      },
    },
  });
  return { context, booking, token, bytes, workflow };
}
it.each(['APPROVE', 'REJECT'] as const)(
  'uploads, privately views, then deletes proof after %s',
  async (decision) => {
    const { context, booking, token, bytes, workflow } = await setup();
    required(await workflow.submitProof({ token, fileBytes: bytes }));
    const input = { organizationId: context.organizationId, bookingId: booking.bookingId };
    const link = required(await workflow.viewProof(input));
    const viewToken = new URL(link.presignedUrl).searchParams.get('token');
    const downloaded = required(await reader.execute(viewToken));
    expect(Buffer.from(downloaded)).toEqual(bytes);
    expect((await reader.execute(`${viewToken}invalid`)).ok).toBe(false);
    required(await workflow.reviewByAdmin({ ...input, decision }));
    expect((await reader.execute(viewToken)).ok).toBe(false);
    const remaining = await db.execute(sql`SELECT count(*)::int AS count FROM private_files`);
    expect(remaining.rows[0]).toEqual({ count: 0 });
  },
);
it('rejects expired capabilities, unsigned keys and malformed storage paths', async () => {
  const { context, booking } = await setup();
  const key = `${context.organizationId}/${booking.bookingId}/${crypto.randomUUID()}.png`;
  const expired = required(await tokens.sign(key, -1));
  expect((await reader.execute(expired)).ok).toBe(false);
  expect((await reader.execute(key)).ok).toBe(false);
  expect((await storage.read('../private-file.png')).ok).toBe(false);
  expect((await tokens.sign('unscoped/file.png', 300)).ok).toBe(false);
});

it('reads current booking context with real dates and rejects wrong versions or tenants', async () => {
  const { context, booking, token } = await setup();
  const reader = new ReadSelfBookingUseCase(new DrizzleSelfBookingRepository(db), secret);
  const result = required(await reader.execute(token));
  expect(result.canUploadProof).toBe(true);
  expect(result.canCancel).toBe(true);
  expect(result.startsAtIso).toBe(context.startsAt.toISOString());
  const repository = new DrizzleSelfBookingRepository(db);
  expect(
    (
      await repository.read({
        organizationId: crypto.randomUUID(),
        bookingId: booking.bookingId,
        version: 0,
        expUnixSeconds: 1,
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await repository.read({
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        version: 1,
        expUnixSeconds: 1,
      })
    ).ok,
  ).toBe(false);
});
