import type { Result } from '../lib/result';
import type { PortalServices } from './portal';
import type { PortalCommand } from '../core/validation/portal-command';
export function dispatchPortal(
  services: PortalServices,
  command: PortalCommand,
): Promise<Result<unknown>> {
  switch (command.action) {
    case 'appearance':
      return services.organizations.appearance(command.input);
    case 'connect-stripe':
      return services.connect.authorize(command.input);
    case 'platform-stripe':
      return services.connect.platform(command.input);
    case 'update-activity':
      return services.management.update(command.input);
    case 'publish-activity':
      return services.management.publish(command.input);
    case 'add-session':
      return services.management.addSession(command.input);
    case 'record-bank-refund':
      return services.management.refund(command.input);
    case 'create-organization':
      return services.organizations.create(command.input);
    case 'create-activity':
      return services.activities.create(command.input);
    case 'archive-activity':
      return services.activities.archive(command.input);
    case 'settings':
      return services.organizations.settings(command.input);
    case 'grant-access':
      return services.platform.grant(command.input);
    case 'suspend':
      return services.platform.suspend(command.input);
    case 'subscription':
      return services.subscription.execute(command.input);
  }
}
