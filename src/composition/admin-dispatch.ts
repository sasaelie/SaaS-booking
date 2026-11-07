import type { AdminCommand } from '../core/validation/admin-command';
import type { administration } from './administration';
export function dispatchAdmin(services: ReturnType<typeof administration>, command: AdminCommand) {
  switch (command.action) {
    case 'close':
      return services.closure.execute(command);
    case 'pause':
      return services.pause.execute(command);
    case 'review-bank':
      return services.bank.reviewByAdmin(command);
    case 'view-proof':
      return services.bank.viewProof(command);
    case 'cancel':
      return services.voucher.cancelByAdministrator(command);
    case 'external-benefit':
      return services.voucher.redeemForOnlineCourse(command);
    case 'privacy':
      return services.gdpr.handleAttendeePrivacyErasureRequest(command);
  }
}
