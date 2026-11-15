import { notFound } from 'next/navigation';
import { STAGING } from '../../config/staging';
import { PAGE_LOADING } from '../../config/page-loading';
import { LoadingPreview } from '../_loading-preview/LoadingPreview';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: PAGE_LOADING.PREVIEW_TITLE,
  robots: { index: false, follow: false },
};
export default function LoadingPreviewPage() {
  if (process.env['APP_ENVIRONMENT'] !== STAGING.MODE) notFound();
  return <LoadingPreview />;
}
