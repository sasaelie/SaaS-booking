'use client';
import { useRouter } from 'next/navigation';
import { BILLING_UI } from '../../config/constants';
export function RefreshButton() {
  const router = useRouter();
  return (
    <button type="button" className="portal-text-button" onClick={() => router.refresh()}>
      {BILLING_UI.REFRESH}
    </button>
  );
}
