import type { Resend } from 'resend';
import type { AdministratorCodeMailPort } from '../../core/ports/administrator-codes';
import type { PortalActor } from '../../core/ports/portal-models';
import { ADMIN_CODES as C } from '../../config/administrator-codes';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export class AdministratorCodeMailAdapter implements AdministratorCodeMailPort {
  readonly available: boolean;
  constructor(
    private readonly resend: Resend | null,
    private readonly from: string | undefined,
  ) {
    this.available = Boolean(resend && from);
  }
  async send(actor: PortalActor, code: string, idempotencyKey: string) {
    if (!this.resend || !this.from)
      return failure(ERROR_CODES.CONFIGURATION_ERROR, 'AdministratorMail', 'configuration');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Error('Mail timeout')), C.SEND_TIMEOUT_MS);
      });
      const result = await Promise.race([
        this.resend.emails.send(
          {
            from: this.from,
            to: actor.email,
            subject: C.EMAIL_SUBJECT,
            text: `${C.EMAIL_TEXT}\n\n${code}\n\n${C.EMAIL_FOOTER}`,
          },
          { idempotencyKey },
        ),
        deadline,
      ]);
      return result.error
        ? failure(ERROR_CODES.INTERNAL_ERROR, 'AdministratorMail', 'send')
        : ok(undefined);
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'AdministratorMail', 'send');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
