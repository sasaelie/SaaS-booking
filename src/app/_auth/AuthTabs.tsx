import { AppLink as Link } from '../_ui/AppLink';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { planPath } from '../../lib/plan-selection';
import { PARTICIPANT_UI as UI } from '../../config/constants';
export function AuthTabs({
  plan,
  client = false,
}: {
  readonly plan: PlanIntent | null;
  readonly client?: boolean;
}) {
  const path = planPath('/connexion', plan);
  return (
    <nav className="participant-login-tabs" aria-label="Type de connexion">
      {client ? (
        <Link href={path}>{UI.ORGANIZER}</Link>
      ) : (
        <span aria-current="page">{UI.ORGANIZER}</span>
      )}
      {client ? (
        <span aria-current="page">{UI.CLIENT}</span>
      ) : (
        <Link href={`${path}${plan ? '&' : '?'}acces=participant`}>{UI.CLIENT}</Link>
      )}
    </nav>
  );
}
