import type { Result } from '../../../lib/result';
import type { PlatformBillableSource } from '../../../core/ports/platform-billing';
import type { PlatformBillingSettings } from '../../../core/validation/platform-billing';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { PlatformInvoiceDraft } from './PlatformInvoiceDraft';
import { PressableLink as Link } from '../../_ui/PressableLink';
export function PlatformBillingPreparation({
  source,
  settings,
}: {
  readonly source: Result<PlatformBillableSource> | null;
  readonly settings: PlatformBillingSettings | null;
}) {
  if (!source) return null;
  if (!source.ok)
    return (
      <p className="portal-notice" role="alert">
        {source.error.code === 'CONFLICT' ? UI.CREDIT_UNAVAILABLE : UI.SOURCE_UNAVAILABLE}
      </p>
    );
  if (source.value.existingDocumentId)
    return (
      <p className="portal-muted" role="status">
        {UI.DOCUMENT_READY}
      </p>
    );
  if (!settings)
    return (
      <p className="portal-notice">
        {UI.SETUP_REQUIRED} <Link href="/plateforme/finances?view=parametres">{UI.SETTINGS}</Link>
      </p>
    );
  return <PlatformInvoiceDraft source={source.value} settings={settings} />;
}
