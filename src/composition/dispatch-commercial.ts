import type { PortalServices } from './portal';
import type { PortalCommand } from '../core/validation/portal-command';
type CommercialCommand = Extract<
  PortalCommand,
  {
    action:
      | 'platform-cost'
      | 'redeem-online-voucher'
      | 'liberty-selection'
      | 'manual-voucher'
      | 'record-offline-payment'
      | 'record-bank-refund';
  }
>;
export function dispatchCommercial(services: PortalServices, command: CommercialCommand) {
  switch (command.action) {
    case 'record-bank-refund':
      return services.management.refund(command.input);
    case 'record-offline-payment':
      return services.recordedPayment.execute(command.input);
    case 'platform-cost':
      return services.financial.recordCost(command.input);
    case 'redeem-online-voucher':
      return services.administration.voucher.redeemForOnlineCourse(command.input);
    case 'liberty-selection':
      return services.financial.selectActivities(command.input);
    case 'manual-voucher':
      return services.manualVoucher.issue(command.input);
  }
}
