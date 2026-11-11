import { PLAN_UI } from '../../config/commercial';
export function PlatformSignature() {
  return (
    <a className="platform-signature" href="/" target="_top">
      {PLAN_UI.SIGNATURE}
    </a>
  );
}
