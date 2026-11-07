import { guardUseCase } from '../../lib/guard-use-case';
import { publicSchedule, publicBookingPage } from '../domain/public-booking-page';
import { z } from 'zod';
import { ERROR_CODES, INPUT_LIMITS } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import type { PublicActivityRepositoryPort } from '../ports/booking-ports';
import { generateDynamicTerms } from '../domain/terms-generator';

const PublicRequestSchema = z.object({
  slug: z.string().min(1).max(INPUT_LIMITS.KEY_MAX),
  activityId: z.uuid(),
});
export class GetBookingPageUseCase {
  constructor(private readonly repository: PublicActivityRepositoryPort) {}
  async execute(raw: unknown) {
    return guardUseCase('get-booking-page.use-case.ts', 'execute', async () => {
      const parsed = PublicRequestSchema.safeParse(raw);
      if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'BookingPage', 'execute');
      const result = await this.repository.findPublicActivity(
        parsed.data.slug,
        parsed.data.activityId,
      );
      if (!result.ok) return result;
      const activity = result.value;
      const terms = await generateDynamicTerms({
        ...activity,
        activityName: activity.name,
      });
      if (!terms.ok) return terms;
      const schedule = publicSchedule(activity, new Date());
      return schedule.ok ? ok(publicBookingPage(activity, terms.value, schedule.value)) : schedule;
    });
  }
}
export type BookingPageData = Extract<
  Awaited<ReturnType<GetBookingPageUseCase['execute']>>,
  { ok: true }
>['value'];
