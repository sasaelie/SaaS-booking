import type { Resend } from 'resend';
import { AUTH_MAIL, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
export async function sendAuthEmail(
  resend: Resend | null,
  from: string | undefined,
  to: string,
  url: string,
  reset: boolean,
) {
  if (!resend || !from) {
    failure(ERROR_CODES.CONFIGURATION_ERROR, 'Authentication', 'mail');
    throw Error('Authentication mail unavailable');
  }
  const result = await resend.emails.send({
    from,
    to,
    subject: reset ? AUTH_MAIL.RESET_SUBJECT : AUTH_MAIL.VERIFY_SUBJECT,
    text: `${reset ? AUTH_MAIL.RESET_TEXT : AUTH_MAIL.VERIFY_TEXT}\n\n${url}\n\n${AUTH_MAIL.FOOTER}`,
  });
  if (result.error) {
    failure(ERROR_CODES.INTERNAL_ERROR, 'Authentication', 'mail');
    throw Error('Authentication mail failed');
  }
}
