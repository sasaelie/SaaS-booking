import { DEFAULTS } from '../../config/constants';
import { SERVICE_MAIL } from '../../config/service-mail';
interface CancellationMessage {
  readonly organizationName: string;
  readonly activityName: string;
  readonly reason: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly timezone: string;
  readonly refundPending: boolean;
}
export function cancellationMessage(input: CancellationMessage): string {
  const date = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: input.timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  });
  return [
    input.organizationName,
    SERVICE_MAIL.CANCELLED,
    `${SERVICE_MAIL.SUMMARY} ${input.activityName}`,
    `${SERVICE_MAIL.HOURS} ${date.format(input.startsAt)} — ${date.format(input.endsAt)} (${input.timezone})`,
    `${SERVICE_MAIL.REASON}\n${input.reason || SERVICE_MAIL.REASON_UNSET}`,
    input.refundPending ? SERVICE_MAIL.REFUND_PENDING : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
