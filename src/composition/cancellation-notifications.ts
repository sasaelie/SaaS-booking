import 'server-only';
import { after } from 'next/server';
import { z } from 'zod';
import type { JobRunnerPort } from '../core/ports/jobs.port';
const QueuedCancellationSchema = z.object({
  status: z.literal('CLOSED_AND_REFUNDS_QUEUED'),
  notificationBookingIds: z.array(z.uuid()),
});
export function scheduleCancellationNotifications(
  organizationId: string,
  outcome: unknown,
  runner: JobRunnerPort,
) {
  const result = QueuedCancellationSchema.safeParse(outcome);
  if (!result.success || !result.data.notificationBookingIds.length) return;
  after(async () => {
    await runner.runCancellationBatch(organizationId, result.data.notificationBookingIds);
  });
}
