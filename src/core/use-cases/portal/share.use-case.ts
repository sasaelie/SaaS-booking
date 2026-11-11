import { z } from 'zod';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import type { QrCodePort } from '../../ports/public-catalog.port';
import { withPortalActor } from './actor';
import { canUsePro } from '../../domain/commercial';
const ShareSchema = z.object({
  organizationId: z.uuid(),
  activityId: z.uuid().optional(),
  format: z.enum(['png', 'pdf']).default('png'),
});
export class ShareUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
    private readonly qr: QrCodePort,
    private readonly appUrl: string,
  ) {}
  qrCode(raw: unknown) {
    return withPortalActor(this.identity, 'Share', async (actor) => {
      const parsed = ShareSchema.safeParse(raw);
      if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Share', 'input');
      const overview = await this.repository.overview(actor, parsed.data.organizationId);
      if (!overview.ok) return overview;
      if (!canUsePro(overview.value.organization.access, new Date()))
        return failure(ERROR_CODES.SUBSCRIPTION_REQUIRED, 'Share', 'qr');
      if (
        parsed.data.activityId &&
        !overview.value.activities.some((activity) => activity.id === parsed.data.activityId)
      )
        return failure(ERROR_CODES.NOT_FOUND, 'Share', 'activity');
      const url = `${this.appUrl}/${overview.value.organization.slug}${parsed.data.activityId ? `/${parsed.data.activityId}` : ''}`;
      const image = await this.qr.encode(url, parsed.data.format);
      return image.ok ? ok(image.value) : image;
    });
  }
}
