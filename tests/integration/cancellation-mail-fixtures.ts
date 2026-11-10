import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { required } from '../../src/adapters/db/transaction';
import { DrizzleClosureRepository } from '../../src/adapters/db/drizzle-closure.repository';
import { outboxJobs } from '../../src/adapters/db/schema';
import { eq } from 'drizzle-orm';
export async function cancellationFixture() {
  const context = await fixture();
  const first = required(await reserve({ ...rawInput(context), email: 'one@example.com' }));
  const second = required(await reserve({ ...rawInput(context), email: 'two@example.com' }));
  const repo = new DrizzleClosureRepository(db);
  const command = {
    organizationId: context.organizationId,
    sessionId: first.sessionId,
    confirmCancelExistingBookings: false,
    reason: 'Professeur indisponible.\nMerci de votre compréhension.',
  };
  const preview = required(await repo.closeSessionAtomically(command));
  if (preview.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected confirmation');
  const before = await db.select().from(outboxJobs).where(eq(outboxJobs.type, 'CANCELLATION'));
  const result = required(
    await repo.closeSessionAtomically({
      ...command,
      confirmCancelExistingBookings: true,
      confirmationHash: preview.confirmationHash,
    }),
  );
  if (result.status !== 'CLOSED_AND_REFUNDS_QUEUED') throw Error('Expected closure');
  return { context, first, second, command, result, before, repo };
}
