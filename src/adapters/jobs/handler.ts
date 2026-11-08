import { purgeBrand } from './purge-brand';
import { purgeProof } from './purge';
import { Resend } from 'resend';
import type { JobHandlerPort, JobEffect } from '../../core/ports/jobs.port';
import type { PaymentGatewayPort } from '../../core/ports/payment-gateway.port';
import type { PrivateProofStoragePort } from '../../core/ports/bank.port';
import type { DrizzlePgDb } from '../db/client';
import { JOB_TYPES, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { RefundJobSchema } from './job-validation';
import { mailContent } from './mail-content';
interface JobHandlerDeps {
  readonly db: DrizzlePgDb;
  readonly gateway: PaymentGatewayPort;
  readonly storage: PrivateProofStoragePort;
  readonly resend: Resend | null;
  readonly mailFrom: string | null;
  readonly appUrl: string;
  readonly secret: string;
}
export class ProductionJobHandler implements JobHandlerPort {
  constructor(private readonly deps: JobHandlerDeps) {}
  async execute(type: string, payload: unknown, key: string): Promise<Result<JobEffect>> {
    try {
      if (type === JOB_TYPES.REFUND)
        return this.deps.gateway.refundPayment({
          ...RefundJobSchema.parse(payload),
          reason: 'Booking refund',
        });
      if (type === JOB_TYPES.MEDIA_PURGE)
        return purgeBrand(this.deps.db, this.deps.storage, payload);
      if (type === JOB_TYPES.PURGE) return purgeProof(this.deps.db, this.deps.storage, payload);
      const content = await mailContent(
        this.deps.db,
        type,
        payload,
        this.deps.appUrl,
        this.deps.secret,
      );
      if (!content) return ok({});
      if (!this.deps.resend || !this.deps.mailFrom)
        return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Jobs', 'email');
      const sent = await this.deps.resend.emails.send(
        { ...content, from: this.deps.mailFrom },
        { idempotencyKey: key },
      );
      return sent.error ? failure(ERROR_CODES.INTERNAL_ERROR, 'Jobs', 'email') : ok({});
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'Jobs', 'execute');
    }
  }
}
